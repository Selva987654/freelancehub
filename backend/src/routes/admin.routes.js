const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', asyncHandler(async (req, res) => {
  const count = (sql, ...params) => db.prepare(sql).get(...params).c;
  res.json({
    users: count('SELECT COUNT(*) c FROM users'),
    clients: count(`SELECT COUNT(*) c FROM users WHERE role = 'client'`),
    providers: count(`SELECT COUNT(*) c FROM users WHERE role = 'provider'`),
    requests: count('SELECT COUNT(*) c FROM requests'),
    openRequests: count(`SELECT COUNT(*) c FROM requests WHERE status = 'open'`),
    offers: count('SELECT COUNT(*) c FROM offers'),
    projects: count('SELECT COUNT(*) c FROM projects'),
    activeProjects: count(`SELECT COUNT(*) c FROM projects WHERE status != 'completed'`),
    completedProjects: count(`SELECT COUNT(*) c FROM projects WHERE status = 'completed'`),
    services: count('SELECT COUNT(*) c FROM services'),
    reviews: count('SELECT COUNT(*) c FROM reviews'),
    reports: count(`SELECT COUNT(*) c FROM reports WHERE status = 'open'`),
    totalProjectValue: db.prepare('SELECT COALESCE(SUM(price),0) v FROM projects').get().v,
  });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const { role, q, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT id, email, name, role, avatar_url, is_active, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  const all = db.prepare(sql).all(...params);
  const start = (Number(page) - 1) * Number(pageSize);
  res.json({ users: all.slice(start, start + Number(pageSize)), total: all.length });
}));

router.put('/users/:id/active', asyncHandler(async (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) throw new ApiError(404, 'This user could not be found.');
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(req.body.isActive ? 1 : 0, req.params.id);
  res.json({ success: true });
}));

router.put('/providers/:id/verify', asyncHandler(async (req, res) => {
  const target = db.prepare('SELECT user_id FROM provider_profiles WHERE user_id = ?').get(req.params.id);
  if (!target) throw new ApiError(404, 'This provider could not be found.');
  db.prepare('UPDATE provider_profiles SET verified = ? WHERE user_id = ?').run(req.body.verified ? 1 : 0, req.params.id);
  res.json({ success: true });
}));

router.get('/requests', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT r.*, u.name AS client_name, c.name AS category_name,
       (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offer_count
     FROM requests r JOIN users u ON u.id = r.client_id LEFT JOIN categories c ON c.id = r.category_id
     ORDER BY r.created_at DESC LIMIT 200`
  ).all();
  res.json({ requests: rows });
}));

router.get('/offers', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT o.*, r.title AS request_title, u.name AS provider_name
     FROM offers o JOIN requests r ON r.id = o.request_id JOIN users u ON u.id = o.provider_id
     ORDER BY o.created_at DESC LIMIT 200`
  ).all();
  res.json({ offers: rows });
}));

router.get('/projects', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT p.*, cu.name AS client_name, pu.name AS provider_name
     FROM projects p JOIN users cu ON cu.id = p.client_id JOIN users pu ON pu.id = p.provider_id
     ORDER BY p.created_at DESC LIMIT 200`
  ).all();
  res.json({ projects: rows });
}));

router.get('/services', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT sv.*, u.name AS provider_name FROM services sv JOIN users u ON u.id = sv.provider_id
     ORDER BY sv.created_at DESC LIMIT 200`
  ).all();
  res.json({ services: rows });
}));

router.get('/reviews', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT r.*, ru.name AS reviewer_name, tu.name AS reviewee_name
     FROM reviews r JOIN users ru ON ru.id = r.reviewer_id JOIN users tu ON tu.id = r.reviewee_id
     ORDER BY r.created_at DESC LIMIT 200`
  ).all();
  res.json({ reviews: rows });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT c.*,
       (SELECT COUNT(*) FROM requests r WHERE r.category_id = c.id) AS request_count,
       (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id) AS service_count
     FROM categories c ORDER BY c.name`
  ).all();
  res.json({ categories: rows });
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT rep.*, u.name AS reporter_name FROM reports rep LEFT JOIN users u ON u.id = rep.reporter_id
     ORDER BY rep.created_at DESC`
  ).all();
  res.json({ reports: rows });
}));

router.put('/reports/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['open', 'reviewed', 'dismissed'].includes(status)) throw new ApiError(400, 'Invalid report status.');
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
}));

module.exports = router;
