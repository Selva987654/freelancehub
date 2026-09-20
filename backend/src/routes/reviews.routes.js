const express = require('express');
const db = require('../db');
const { id } = require('../utils/ids');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('../services/notify');

const router = express.Router();

router.post('/projects/:projectId/reviews', requireAuth, asyncHandler(async (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) throw new ApiError(404, 'This project could not be found.');
  if (project.client_id !== req.user.id && project.provider_id !== req.user.id) {
    throw new ApiError(403, 'You are not part of this project.');
  }
  if (project.status !== 'completed') throw new ApiError(409, 'Reviews can only be left after a project is completed.');

  const existing = db.prepare('SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ?').get(project.id, req.user.id);
  if (existing) throw new ApiError(409, 'You\u2019ve already reviewed this project.');

  const { rating, comment, categoryRatings } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Please choose a rating between 1 and 5.');

  const revieweeId = req.user.id === project.client_id ? project.provider_id : project.client_id;
  const rid = id('rev');
  db.prepare(
    `INSERT INTO reviews (id, project_id, reviewer_id, reviewee_id, rating, comment, category_ratings)
     VALUES (?,?,?,?,?,?,?)`
  ).run(rid, project.id, req.user.id, revieweeId, rating, comment || '', JSON.stringify(categoryRatings || {}));

  // Recompute the reviewee's aggregate rating if they're a provider
  const provider = db.prepare('SELECT user_id FROM provider_profiles WHERE user_id = ?').get(revieweeId);
  if (provider) {
    const agg = db.prepare('SELECT AVG(rating) avg, COUNT(*) cnt FROM reviews WHERE reviewee_id = ?').get(revieweeId);
    db.prepare('UPDATE provider_profiles SET rating_avg = ?, rating_count = ? WHERE user_id = ?')
      .run(Math.round(agg.avg * 10) / 10, agg.cnt, revieweeId);
  }

  const io = req.app.get('io');
  notifyUser(io, revieweeId, {
    type: 'review', title: 'New review',
    body: `${req.user.name} left you a ${rating}-star review.`,
    link: req.user.id === project.client_id ? `/providers/${revieweeId}` : `/projects/${project.id}`,
  });

  res.status(201).json({ review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(rid) });
}));

router.get('/users/:userId/reviews', asyncHandler(async (req, res) => {
  const rows = db.prepare(
    `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar FROM reviews r
     JOIN users u ON u.id = r.reviewer_id WHERE r.reviewee_id = ? ORDER BY r.created_at DESC`
  ).all(req.params.userId).map(r => ({ ...r, category_ratings: r.category_ratings ? JSON.parse(r.category_ratings) : null }));
  res.json({ reviews: rows });
}));

module.exports = router;
