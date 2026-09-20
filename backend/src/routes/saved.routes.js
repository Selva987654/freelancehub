const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM saved_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

  const enriched = rows.map((row) => {
    let item = null;
    if (row.item_type === 'provider') {
      item = db.prepare(
        `SELECT u.id, u.name, u.avatar_url, pp.headline, pp.provider_type, pp.starting_price, pp.rating_avg, pp.rating_count
         FROM users u JOIN provider_profiles pp ON pp.user_id = u.id WHERE u.id = ?`
      ).get(row.item_id);
    } else if (row.item_type === 'service') {
      item = db.prepare('SELECT id, title, starting_price, delivery_days, cover_seed FROM services WHERE id = ?').get(row.item_id);
    } else if (row.item_type === 'request') {
      item = db.prepare('SELECT id, title, budget_range, status FROM requests WHERE id = ?').get(row.item_id);
    }
    return { ...row, item };
  }).filter(r => r.item);

  res.json({ saved: enriched });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.body;
  if (!['provider', 'service', 'request'].includes(itemType)) throw new ApiError(400, 'Invalid item type.');
  const existing = db.prepare('SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(req.user.id, itemType, itemId);
  if (existing) return res.json({ saved: existing, alreadySaved: true });
  const sid = id('sav');
  db.prepare('INSERT INTO saved_items (id, user_id, item_type, item_id) VALUES (?,?,?,?)').run(sid, req.user.id, itemType, itemId);
  res.status(201).json({ saved: db.prepare('SELECT * FROM saved_items WHERE id = ?').get(sid) });
}));

router.delete('/', requireAuth, asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.body;
  db.prepare('DELETE FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?').run(req.user.id, itemType, itemId);
  res.json({ success: true });
}));

module.exports = router;
