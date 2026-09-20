const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../services/notify');

const router = express.Router();

function parseOffer(o) {
  return { ...o, includes: JSON.parse(o.includes || '[]'), milestones: JSON.parse(o.milestones || '[]') };
}

router.get('/mine', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT o.*, r.title AS request_title, r.status AS request_status, r.budget_range
     FROM offers o JOIN requests r ON r.id = o.request_id
     WHERE o.provider_id = ? ORDER BY o.created_at DESC`
  ).all(req.user.id).map(parseOffer);
  res.json({ offers: rows });
}));

router.get('/received', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT o.*, r.title AS request_title, r.status AS request_status,
       u.name AS provider_name, u.avatar_url AS provider_avatar, pp.rating_avg, pp.rating_count, pp.provider_type
     FROM offers o
     JOIN requests r ON r.id = o.request_id
     JOIN users u ON u.id = o.provider_id
     JOIN provider_profiles pp ON pp.user_id = o.provider_id
     WHERE r.client_id = ?
     ORDER BY o.created_at DESC`
  ).all(req.user.id).map(parseOffer);
  res.json({ offers: rows });
}));

router.post('/requests/:requestId/offers', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.requestId);
  if (!request) throw new ApiError(404, 'This request could not be found.');
  if (request.status !== 'open') throw new ApiError(409, 'This request is no longer accepting offers.');

  const existing = db.prepare('SELECT id FROM offers WHERE request_id = ? AND provider_id = ?').get(request.id, req.user.id);
  if (existing) throw new ApiError(409, 'You\u2019ve already sent an offer for this request.');

  const { price, deliveryDays, message, includes, milestones } = req.body;
  if (!price || price <= 0) throw new ApiError(400, 'Please enter a price above ₹0.');
  if (!deliveryDays || deliveryDays <= 0) throw new ApiError(400, 'Please enter a delivery time.');

  const oid = id('off');
  db.prepare(
    `INSERT INTO offers (id, request_id, provider_id, price, delivery_days, message, includes, milestones, status)
     VALUES (?,?,?,?,?,?,?,?, 'pending')`
  ).run(oid, request.id, req.user.id, price, deliveryDays, message || '', JSON.stringify(includes || []), JSON.stringify(milestones || []));

  const io = req.app.get('io');
  notifyUser(io, request.client_id, {
    type: 'offer', title: 'New offer received',
    body: `${req.user.name} sent an offer on "${request.title}".`,
    link: `/requests/${request.id}`,
  });

  res.status(201).json({ offer: parseOffer(db.prepare('SELECT * FROM offers WHERE id = ?').get(oid)) });
}));

router.put('/:id/withdraw', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!offer) throw new ApiError(404, 'This offer could not be found.');
  if (offer.provider_id !== req.user.id) throw new ApiError(403, 'You can only withdraw your own offers.');
  if (offer.status !== 'pending') throw new ApiError(409, 'Only pending offers can be withdrawn.');
  db.prepare(`UPDATE offers SET status = 'withdrawn' WHERE id = ?`).run(offer.id);
  res.json({ success: true });
}));

router.put('/:id/decline', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!offer) throw new ApiError(404, 'This offer could not be found.');
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(offer.request_id);
  if (request.client_id !== req.user.id) throw new ApiError(403, 'You can only manage offers on your own requests.');
  if (offer.status !== 'pending') throw new ApiError(409, 'This offer has already been decided.');

  db.prepare(`UPDATE offers SET status = 'declined' WHERE id = ?`).run(offer.id);
  const io = req.app.get('io');
  notifyUser(io, offer.provider_id, {
    type: 'offer_declined', title: 'Offer declined',
    body: `${req.user.name} declined your offer on "${request.title}".`,
    link: `/requests/${request.id}`,
  });
  res.json({ success: true });
}));

router.put('/:id/accept', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!offer) throw new ApiError(404, 'This offer could not be found.');
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(offer.request_id);
  if (request.client_id !== req.user.id) throw new ApiError(403, 'You can only manage offers on your own requests.');
  if (offer.status !== 'pending') throw new ApiError(409, 'This offer has already been decided.');
  if (request.status !== 'open') throw new ApiError(409, 'This request already has an active project — a client cannot accept two offers for the same request.');

  const io = req.app.get('io');
  let project;

  db.transaction(() => {
    db.prepare(`UPDATE offers SET status = 'accepted' WHERE id = ?`).run(offer.id);
    db.prepare(`UPDATE offers SET status = 'declined' WHERE request_id = ? AND id != ? AND status = 'pending'`)
      .run(request.id, offer.id);
    db.prepare(`UPDATE requests SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?`).run(request.id);

    const pid = id('prj');
    db.prepare(
      `INSERT INTO projects (id, request_id, offer_id, client_id, provider_id, title, price, status)
       VALUES (?,?,?,?,?,?,?, 'planning')`
    ).run(pid, request.id, offer.id, request.client_id, offer.provider_id, request.title, offer.price);

    const milestones = JSON.parse(offer.milestones || '[]');
    const msStmt = db.prepare(
      `INSERT INTO milestones (id, project_id, title, amount, status, sort_order) VALUES (?,?,?,?, 'pending', ?)`
    );
    milestones.forEach((m, i) => msStmt.run(id('ms'), pid, m.title, m.amount || 0, i + 1));

    db.prepare(`INSERT INTO activity_log (id, project_id, actor_id, event) VALUES (?,?,?,?)`)
      .run(id('act'), pid, req.user.id, 'Project started');

    // Ensure a conversation exists for this project
    const conv = db.prepare('SELECT id FROM conversations WHERE client_id = ? AND provider_id = ? AND project_id IS NULL')
      .get(request.client_id, offer.provider_id);
    if (conv) {
      db.prepare('UPDATE conversations SET project_id = ? WHERE id = ?').run(pid, conv.id);
    } else {
      db.prepare('INSERT INTO conversations (id, project_id, client_id, provider_id) VALUES (?,?,?,?)')
        .run(id('conv'), pid, request.client_id, offer.provider_id);
    }

    project = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid);
  })();

  notifyUser(io, offer.provider_id, {
    type: 'offer_accepted', title: 'Offer accepted',
    body: `${req.user.name} accepted your offer. A new project has started.`,
    link: `/projects/${project.id}`,
  });

  res.json({ project });
}));

module.exports = router;
