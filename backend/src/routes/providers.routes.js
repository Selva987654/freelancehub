const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, minRating, providerType, availability, remote, location, sort, q, page = 1, pageSize = 12 } = req.query;

  let sql = `
    SELECT u.id, u.name, u.avatar_url, pp.*
    FROM users u JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.is_active = 1`;
  const params = [];

  if (category) {
    sql += ` AND u.id IN (SELECT provider_id FROM services sv JOIN categories c ON c.id = sv.category_id WHERE c.slug = ?)`;
    params.push(category);
  }
  if (providerType) { sql += ' AND pp.provider_type = ?'; params.push(providerType); }
  if (availability) { sql += ' AND pp.availability = ?'; params.push(availability); }
  if (remote === 'true') { sql += ' AND pp.remote = 1'; }
  if (minRating) { sql += ' AND pp.rating_avg >= ?'; params.push(parseFloat(minRating)); }
  if (location) { sql += ' AND pp.location LIKE ?'; params.push(`%${location}%`); }
  if (q) { sql += ' AND (u.name LIKE ? OR pp.headline LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

  const sortMap = {
    rating: 'pp.rating_avg DESC',
    newest: 'u.created_at DESC',
    price_low: 'pp.starting_price ASC',
    experienced: 'pp.completed_projects DESC',
  };
  sql += ` ORDER BY ${sortMap[sort] || 'pp.rating_avg DESC'}`;

  const all = db.prepare(sql).all(...params);
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = all.slice(start, start + Number(pageSize));

  const providers = paged.map((p) => {
    p.skills = db.prepare(
      `SELECT s.name FROM provider_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.provider_id = ?`
    ).all(p.id).map(r => r.name);
    return p;
  });

  res.json({ providers, total: all.length, page: Number(page), pageSize: Number(pageSize) });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT id, name, avatar_url, created_at FROM users WHERE id = ? AND role = ?').get(req.params.id, 'provider');
  if (!user) throw new ApiError(404, 'This provider profile could not be found.');
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(user.id);
  profile.social_links = profile.social_links ? JSON.parse(profile.social_links) : {};
  profile.skills = db.prepare(
    `SELECT s.id, s.name FROM provider_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.provider_id = ?`
  ).all(user.id);

  const services = db.prepare(
    `SELECT sv.*, c.name AS category_name FROM services sv LEFT JOIN categories c ON c.id = sv.category_id
     WHERE sv.provider_id = ? AND sv.is_active = 1 ORDER BY sv.created_at DESC`
  ).all(user.id).map(s => ({ ...s, features: JSON.parse(s.features || '[]'), extras: JSON.parse(s.extras || '[]') }));

  const portfolio = db.prepare('SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC').all(user.id);

  const reviews = db.prepare(
    `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar
     FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.reviewee_id = ? ORDER BY r.created_at DESC`
  ).all(user.id).map(r => ({ ...r, category_ratings: r.category_ratings ? JSON.parse(r.category_ratings) : null }));

  let isSaved = false;
  if (req.user) {
    isSaved = !!db.prepare(`SELECT id FROM saved_items WHERE user_id = ? AND item_type = 'provider' AND item_id = ?`)
      .get(req.user.id, user.id);
  }

  res.json({ provider: { ...user, ...profile }, services, portfolio, reviews, isSaved });
}));

module.exports = router;
