const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('../services/notify');

const router = express.Router();

function ensureParticipant(req, project) {
  if (project.client_id !== req.user.id && project.provider_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not part of this project.');
  }
}

function getProjectOr404(projectId) {
  const project = db.prepare(
    `SELECT p.*, cu.name AS client_name, cu.avatar_url AS client_avatar,
            pu.name AS provider_name, pu.avatar_url AS provider_avatar
     FROM projects p
     JOIN users cu ON cu.id = p.client_id
     JOIN users pu ON pu.id = p.provider_id
     WHERE p.id = ?`
  ).get(projectId);
  if (!project) throw new ApiError(404, 'This project could not be found.');
  return project;
}

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const column = req.user.role === 'provider' ? 'p.provider_id' : 'p.client_id';
  const rows = db.prepare(
    `SELECT p.*, cu.name AS client_name, pu.name AS provider_name, pu.avatar_url as provider_avatar, cu.avatar_url as client_avatar
     FROM projects p JOIN users cu ON cu.id = p.client_id JOIN users pu ON pu.id = p.provider_id
     WHERE ${column} = ? ORDER BY p.updated_at DESC`
  ).all(req.user.id);
  res.json({ projects: rows });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const project = getProjectOr404(req.params.id);
  ensureParticipant(req, project);

  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order ASC').all(project.id);
  const deliveries = db.prepare('SELECT * FROM deliveries WHERE project_id = ? ORDER BY created_at DESC').all(project.id)
    .map(d => ({ ...d, files: JSON.parse(d.files || '[]'), links: JSON.parse(d.links || '[]') }));
  const activity = db.prepare(
    `SELECT a.*, u.name AS actor_name FROM activity_log a LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.project_id = ? ORDER BY a.created_at DESC`
  ).all(project.id);
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(project.request_id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE project_id = ?').all(project.id);

  res.json({ project, milestones, deliveries, activity, request, reviews });
}));

router.put('/:id/notes', requireAuth, asyncHandler(async (req, res) => {
  const project = getProjectOr404(req.params.id);
  ensureParticipant(req, project);
  db.prepare(`UPDATE projects SET notes = ?, updated_at = datetime('now') WHERE id = ?`).run(req.body.notes || '', project.id);
  res.json({ success: true });
}));

router.put('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const project = getProjectOr404(req.params.id);
  ensureParticipant(req, project);
  const allowed = ['planning', 'working', 'review', 'completed'];
  if (!allowed.includes(req.body.status)) throw new ApiError(400, 'That is not a valid project status.');
  db.prepare(`UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(req.body.status, project.id);
  db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
    .run(id('act'), project.id, req.user.id, `Project marked as ${req.body.status}`);
  res.json({ success: true });
}));

// ---- Milestones ----
router.post('/:id/milestones', requireAuth, asyncHandler(async (req, res) => {
  const project = getProjectOr404(req.params.id);
  ensureParticipant(req, project);
  const { title, description, amount, dueDate } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Please give the milestone a title.');
  const count = db.prepare('SELECT COUNT(*) c FROM milestones WHERE project_id = ?').get(project.id).c;
  const mid = id('ms');
  db.prepare(
    `INSERT INTO milestones (id, project_id, title, description, amount, due_date, status, sort_order) VALUES (?,?,?,?,?,?, 'pending', ?)`
  ).run(mid, project.id, title.trim(), description || '', amount || 0, dueDate || null, count + 1);
  db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
    .run(id('act'), project.id, req.user.id, `Milestone "${title.trim()}" added`);
  res.status(201).json({ milestone: db.prepare('SELECT * FROM milestones WHERE id = ?').get(mid) });
}));

router.put('/milestones/:milestoneId', requireAuth, asyncHandler(async (req, res) => {
  const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.milestoneId);
  if (!milestone) throw new ApiError(404, 'This milestone could not be found.');
  const project = getProjectOr404(milestone.project_id);
  ensureParticipant(req, project);

  const allowed = ['pending', 'in_progress', 'submitted', 'approved'];
  const { status } = req.body;
  if (status && !allowed.includes(status)) throw new ApiError(400, 'That is not a valid milestone status.');

  db.prepare('UPDATE milestones SET status = COALESCE(?, status) WHERE id = ?').run(status || null, milestone.id);
  if (status) {
    db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
      .run(id('act'), project.id, req.user.id, `Milestone "${milestone.title}" marked ${status.replace('_', ' ')}`);
  }
  res.json({ milestone: db.prepare('SELECT * FROM milestones WHERE id = ?').get(milestone.id) });
}));

// ---- Deliveries ----
router.post('/:id/deliveries', requireAuth, asyncHandler(async (req, res) => {
  const project = getProjectOr404(req.params.id);
  ensureParticipant(req, project);
  if (req.user.id !== project.provider_id) throw new ApiError(403, 'Only the provider can submit a delivery.');

  const { message, files, links } = req.body;
  const did = id('del');
  db.prepare(
    `INSERT INTO deliveries (id, project_id, message, files, links, status) VALUES (?,?,?,?,?, 'submitted')`
  ).run(did, project.id, message || '', JSON.stringify(files || []), JSON.stringify(links || []));

  db.prepare(`UPDATE projects SET status = 'review', updated_at = datetime('now') WHERE id = ?`).run(project.id);
  db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
    .run(id('act'), project.id, req.user.id, 'Delivery submitted for review');

  const io = req.app.get('io');
  notifyUser(io, project.client_id, {
    type: 'delivery', title: 'Delivery submitted',
    body: `${req.user.name} submitted a delivery for review.`,
    link: `/projects/${project.id}`,
  });

  res.status(201).json({ delivery: db.prepare('SELECT * FROM deliveries WHERE id = ?').get(did) });
}));

router.put('/deliveries/:deliveryId/approve', requireAuth, asyncHandler(async (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.deliveryId);
  if (!delivery) throw new ApiError(404, 'This delivery could not be found.');
  const project = getProjectOr404(delivery.project_id);
  if (req.user.id !== project.client_id) throw new ApiError(403, 'Only the client can approve a delivery.');

  db.prepare(`UPDATE deliveries SET status = 'approved' WHERE id = ?`).run(delivery.id);
  db.prepare(`UPDATE projects SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(project.id);
  db.prepare(`UPDATE requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(project.request_id);
  db.prepare(`UPDATE milestones SET status = 'approved' WHERE project_id = ? AND status != 'approved'`).run(project.id);
  db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
    .run(id('act'), project.id, req.user.id, 'Delivery approved — project completed');

  const io = req.app.get('io');
  notifyUser(io, project.provider_id, {
    type: 'delivery_approved', title: 'Delivery approved',
    body: `${req.user.name} approved your delivery. The project is now complete!`,
    link: `/projects/${project.id}`,
  });

  res.json({ success: true });
}));

router.put('/deliveries/:deliveryId/request-changes', requireAuth, asyncHandler(async (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.deliveryId);
  if (!delivery) throw new ApiError(404, 'This delivery could not be found.');
  const project = getProjectOr404(delivery.project_id);
  if (req.user.id !== project.client_id) throw new ApiError(403, 'Only the client can request changes.');

  db.prepare(`UPDATE deliveries SET status = 'changes_requested' WHERE id = ?`).run(delivery.id);
  db.prepare(`UPDATE projects SET status = 'working', updated_at = datetime('now') WHERE id = ?`).run(project.id);
  db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
    .run(id('act'), project.id, req.user.id, `Requested changes: ${req.body.note || 'see message thread'}`);

  const io = req.app.get('io');
  notifyUser(io, project.provider_id, {
    type: 'changes_requested', title: 'Changes requested',
    body: `${req.user.name} requested changes to your delivery.`,
    link: `/projects/${project.id}`,
  });

  res.json({ success: true });
}));

module.exports = router;
