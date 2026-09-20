const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { suggestOfferingsForRequest, recommendProvidersForRequest } = require('../services/matching');

const router = express.Router();

function attachSkills(request) {
  request.skills = db.prepare(
    `SELECT s.id, s.name FROM request_skills rs JOIN skills s ON s.id = rs.skill_id WHERE rs.request_id = ?`
  ).all(request.id);
  return request;
}

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, budget, timeline, status, q, page = 1, pageSize = 12 } = req.query;
  let sql = `
    SELECT r.*, u.name AS client_name, u.avatar_url AS client_avatar, c.name AS category_name, c.slug AS category_slug,
      (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offer_count
    FROM requests r JOIN users u ON u.id = r.client_id LEFT JOIN categories c ON c.id = r.category_id
    WHERE 1=1`;
  const params = [];
  sql += ` AND r.status = ?`; params.push(status || 'open');
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (budget) { sql += ' AND r.budget_range = ?'; params.push(budget); }
  if (timeline) { sql += ' AND r.timeline = ?'; params.push(timeline); }
  if (q) { sql += ' AND (r.title LIKE ? OR r.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY r.created_at DESC';

  const all = db.prepare(sql).all(...params);
  const start = (Number(page) - 1) * Number(pageSize);
  res.json({ requests: all.slice(start, start + Number(pageSize)), total: all.length });
}));

router.get('/mine', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT r.*, c.name AS category_name, c.slug AS category_slug,
      (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) AS offer_count
     FROM requests r LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.client_id = ? ORDER BY r.created_at DESC`
  ).all(req.user.id);
  res.json({ requests: rows });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const request = db.prepare(
    `SELECT r.*, u.name AS client_name, u.avatar_url AS client_avatar, c.name AS category_name, c.slug AS category_slug
     FROM requests r JOIN users u ON u.id = r.client_id LEFT JOIN categories c ON c.id = r.category_id WHERE r.id = ?`
  ).get(req.params.id);
  if (!request) throw new ApiError(404, 'This request could not be found.');
  attachSkills(request);

  let isSaved = false;
  let myOffer = null;
  if (req.user) {
    isSaved = !!db.prepare(`SELECT id FROM saved_items WHERE user_id = ? AND item_type = 'request' AND item_id = ?`)
      .get(req.user.id, request.id);
    if (req.user.role === 'provider') {
      myOffer = db.prepare('SELECT * FROM offers WHERE request_id = ? AND provider_id = ?').get(request.id, req.user.id) || null;
    }
  }

  res.json({ request, isSaved, myOffer });
}));

router.post('/', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const { title, categorySlug, purpose, description, budgetRange, timeline, extraNotes, skillNames } = req.body;
  if (!description || description.trim().length < 15) throw new ApiError(400, 'Please describe what you need in a bit more detail.');
  if (!budgetRange) throw new ApiError(400, 'Please choose a budget range.');
  if (!timeline) throw new ApiError(400, 'Please choose a timeline.');

  const category = categorySlug ? db.prepare('SELECT id FROM categories WHERE slug = ?').get(categorySlug) : null;
  const finalTitle = (title && title.trim()) || description.trim().slice(0, 70);

  const rid = id('req');
  db.prepare(
    `INSERT INTO requests (id, client_id, title, category_id, purpose, description, budget_range, timeline, extra_notes, status)
     VALUES (?,?,?,?,?,?,?,?,?, 'open')`
  ).run(rid, req.user.id, finalTitle, category ? category.id : null, purpose || null, description.trim(), budgetRange, timeline, extraNotes || null);

  if (Array.isArray(skillNames)) {
    for (const name of skillNames) {
      const skill = db.prepare('SELECT id FROM skills WHERE name = ?').get(name);
      if (skill) db.prepare('INSERT OR IGNORE INTO request_skills (request_id, skill_id) VALUES (?,?)').run(rid, skill.id);
    }
  }

  const request = attachSkills(db.prepare('SELECT * FROM requests WHERE id = ?').get(rid));
  const suggestions = suggestOfferingsForRequest(request, categorySlug);
  res.status(201).json({ request, suggestions });
}));

router.put('/:id/close', requireAuth, requireRole('client'), asyncHandler(async (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) throw new ApiError(404, 'This request could not be found.');
  if (request.client_id !== req.user.id) throw new ApiError(403, 'You can only close your own requests.');
  db.prepare(`UPDATE requests SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
}));

router.get('/:id/recommended-providers', optionalAuth, asyncHandler(async (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) throw new ApiError(404, 'This request could not be found.');
  const results = recommendProvidersForRequest(request, { limit: 6 });
  const providers = results.map(({ provider, reasons }) => ({ ...provider, matchReasons: reasons }));
  res.json({ providers });
}));

router.get('/:id/offers', requireAuth, asyncHandler(async (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) throw new ApiError(404, 'This request could not be found.');
  if (request.client_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the person who posted this request can view its offers.');
  }
  const offers = db.prepare(
    `SELECT o.*, u.name AS provider_name, u.avatar_url AS provider_avatar, pp.rating_avg, pp.rating_count, pp.provider_type, pp.availability, pp.completed_projects
     FROM offers o JOIN users u ON u.id = o.provider_id JOIN provider_profiles pp ON pp.user_id = o.provider_id
     WHERE o.request_id = ? ORDER BY o.created_at DESC`
  ).all(req.params.id).map(o => ({ ...o, includes: JSON.parse(o.includes || '[]'), milestones: JSON.parse(o.milestones || '[]') }));
  res.json({ offers });
}));

module.exports = router;
