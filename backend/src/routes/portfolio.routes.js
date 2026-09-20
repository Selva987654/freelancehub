const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  res.json({ items: db.prepare('SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC').all(req.user.id) });
}));

router.post('/', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const { title, description, link } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Please give your portfolio piece a title.');
  const pid = id('pf');
  db.prepare('INSERT INTO portfolio_items (id, provider_id, title, description, cover_seed, link) VALUES (?,?,?,?,?,?)')
    .run(pid, req.user.id, title.trim(), description || '', pid, link || null);
  res.status(201).json({ item: db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(pid) });
}));

router.delete('/:id', requireAuth, requireRole('provider'), asyncHandler(async (req, res) => {
  const existing = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!existing) throw new ApiError(404, 'This portfolio item could not be found.');
  if (existing.provider_id !== req.user.id) throw new ApiError(403, 'You can only remove your own portfolio items.');
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
