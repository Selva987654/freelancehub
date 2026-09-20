const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/categories', asyncHandler(async (req, res) => {
  res.json({ categories: db.prepare('SELECT * FROM categories ORDER BY name').all() });
}));

router.get('/skills', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db.prepare(
        `SELECT s.* FROM skills s JOIN categories c ON c.id = s.category_id WHERE c.slug = ? ORDER BY s.name`
      ).all(category)
    : db.prepare('SELECT * FROM skills ORDER BY name').all();
  res.json({ skills: rows });
}));

router.get('/search', asyncHandler(async (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  if (!req.query.q || !req.query.q.trim()) {
    return res.json({ services: [], providers: [], requests: [], categories: [] });
  }

  const services = db.prepare(
    `SELECT sv.id, sv.title, sv.starting_price, u.name AS provider_name
     FROM services sv JOIN users u ON u.id = sv.provider_id
     WHERE sv.is_active = 1 AND sv.title LIKE ? LIMIT 6`
  ).all(q);

  const providers = db.prepare(
    `SELECT u.id, u.name, pp.headline, pp.provider_type
     FROM users u JOIN provider_profiles pp ON pp.user_id = u.id
     WHERE u.name LIKE ? OR pp.headline LIKE ? LIMIT 6`
  ).all(q, q);

  const requests = db.prepare(
    `SELECT id, title, status FROM requests WHERE status = 'open' AND title LIKE ? LIMIT 6`
  ).all(q);

  const categories = db.prepare(`SELECT id, name, slug FROM categories WHERE name LIKE ? LIMIT 6`).all(q);

  res.json({ services, providers, requests, categories });
}));

router.post('/guidance', asyncHandler(async (req, res) => {
  const { guidedSolutions } = require('../services/matching');
  const { text } = req.body;
  res.json({ solutions: guidedSolutions(text || '') });
}));

module.exports = router;
