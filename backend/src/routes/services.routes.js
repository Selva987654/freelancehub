const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function parseService(s) {
  return { ...s, features: JSON.parse(s.features || '[]'), extras: JSON.parse(s.extras || '[]') };
}

// Discovery: browse all active services
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, maxPrice, sort, q, page = 1, pageSize = 12 } = req.query;
  let sql = `
    SELECT sv.*, u.name AS provider_name, u.avatar_url AS provider_avatar, pp.rating_avg, pp.rating_count, pp.provider_type, pp.availability
    FROM services sv
    JOIN users u ON u.id = sv.provider_id
    JOIN provider_profiles pp ON pp.user_id = sv.provider_id
    LEFT JOIN categories c ON c.id = sv.category_id
    WHERE sv.is_active = 1 AND u.is_active = 1`;
  const params = [];
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (maxPrice) { sql += ' AND sv.starting_price <= ?'; params.push(Number(maxPrice)); }
  if (q) { sql += ' AND sv.title LIKE ?'; params.push(`%${q}%`); }

  const sortMap = {
    newest: 'sv.created_at DESC',
    price_low: 'sv.starting_price ASC',
    rating: 'pp.rating_avg DESC',
  };
  sql += ` ORDER BY ${sortMap[sort] || 'sv.created_at DESC'}`;

  const all = db.prepare(sql).all(...params).map(parseService);
  const start = (Number(page) - 1) * Number(pageSize);
  res.json({ services: all.slice(start, start + Number(pageSize)), total: all.length });
}));

router.get('/mine', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE provider_id = ? ORDER BY created_at DESC').all(req.user.id).map(parseService);
  res.json({ services });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const s = db.prepare(
    `SELECT sv.*, u.name AS provider_name, u.avatar_url AS provider_avatar, pp.rating_avg, pp.rating_count, pp.provider_type
     FROM services sv JOIN users u ON u.id = sv.provider_id JOIN provider_profiles pp ON pp.user_id = sv.provider_id
     WHERE sv.id = ?`
  ).get(req.params.id);
  if (!s) throw new ApiError(404, 'This service could not be found.');
  let isSaved = false;
  if (req.user) {
    isSaved = !!db.prepare(`SELECT id FROM saved_items WHERE user_id = ? AND item_type = 'service' AND item_id = ?`)
      .get(req.user.id, s.id);
  }
  res.json({ service: parseService(s), isSaved });
}));

router.post('/', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const { title, description, categoryId, startingPrice, deliveryDays, features, extras } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Please give your service a title.');
  if (!startingPrice || startingPrice <= 0) throw new ApiError(400, 'Please set a starting price above ₹0.');
  if (!deliveryDays || deliveryDays <= 0) throw new ApiError(400, 'Please set a delivery time.');

  const sid = id('svc');
  db.prepare(
    `INSERT INTO services (id, provider_id, category_id, title, description, starting_price, delivery_days, features, extras, cover_seed)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(sid, req.user.id, categoryId || null, title.trim(), description || '', startingPrice, deliveryDays,
    JSON.stringify(features || []), JSON.stringify(extras || []), sid);

  res.status(201).json({ service: parseService(db.prepare('SELECT * FROM services WHERE id = ?').get(sid)) });
}));

router.put('/:id', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) throw new ApiError(404, 'This service could not be found.');
  if (existing.provider_id !== req.user.id) throw new ApiError(403, 'You can only edit your own services.');

  const { title, description, categoryId, startingPrice, deliveryDays, features, extras, isActive } = req.body;
  db.prepare(
    `UPDATE services SET title = COALESCE(?, title), description = COALESCE(?, description), category_id = COALESCE(?, category_id),
     starting_price = COALESCE(?, starting_price), delivery_days = COALESCE(?, delivery_days),
     features = COALESCE(?, features), extras = COALESCE(?, extras), is_active = COALESCE(?, is_active) WHERE id = ?`
  ).run(title, description, categoryId, startingPrice, deliveryDays,
    features ? JSON.stringify(features) : null, extras ? JSON.stringify(extras) : null,
    isActive === undefined ? null : (isActive ? 1 : 0), req.params.id);

  res.json({ service: parseService(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)) });
}));

router.delete('/:id', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) throw new ApiError(404, 'This service could not be found.');
  if (existing.provider_id !== req.user.id) throw new ApiError(403, 'You can only remove your own services.');
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
