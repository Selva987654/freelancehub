const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { recommendRequestsForProvider } = require('../services/matching');

const router = express.Router();

router.get('/overview', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    const activeRequests = db.prepare(`SELECT COUNT(*) c FROM requests WHERE client_id = ? AND status = 'open'`).get(req.user.id).c;
    const offersReceived = db.prepare(
      `SELECT COUNT(*) c FROM offers o JOIN requests r ON r.id = o.request_id WHERE r.client_id = ? AND o.status = 'pending'`
    ).get(req.user.id).c;
    const activeProjects = db.prepare(
      `SELECT COUNT(*) c FROM projects WHERE client_id = ? AND status != 'completed'`
    ).get(req.user.id).c;
    const completedProjects = db.prepare(
      `SELECT COUNT(*) c FROM projects WHERE client_id = ? AND status = 'completed'`
    ).get(req.user.id).c;
    return res.json({ activeRequests, offersReceived, activeProjects, completedProjects });
  }

  if (req.user.role === 'provider') {
    const offersSent = db.prepare(`SELECT COUNT(*) c FROM offers WHERE provider_id = ?`).get(req.user.id).c;
    const activeProjects = db.prepare(`SELECT COUNT(*) c FROM projects WHERE provider_id = ? AND status != 'completed'`).get(req.user.id).c;
    const completedProjects = db.prepare(`SELECT COUNT(*) c FROM projects WHERE provider_id = ? AND status = 'completed'`).get(req.user.id).c;
    const projectValue = db.prepare(`SELECT COALESCE(SUM(price),0) v FROM projects WHERE provider_id = ?`).get(req.user.id).v;
    const provider = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.user.id);
    const recommended = recommendRequestsForProvider(provider, { limit: 5 }).length;
    return res.json({ offersSent, activeProjects, completedProjects, projectValue, recommendedCount: recommended });
  }

  // Admin
  const totals = {
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    requests: db.prepare('SELECT COUNT(*) c FROM requests').get().c,
    offers: db.prepare('SELECT COUNT(*) c FROM offers').get().c,
    projects: db.prepare('SELECT COUNT(*) c FROM projects').get().c,
    services: db.prepare('SELECT COUNT(*) c FROM services').get().c,
    reviews: db.prepare('SELECT COUNT(*) c FROM reviews').get().c,
  };
  res.json(totals);
}));

router.get('/recommended-requests', requireAuth, asyncHandler(async (req, res) => {
  const provider = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.json({ requests: [] });
  const results = recommendRequestsForProvider(provider, { limit: 8 });
  const requests = results.map(({ request, reasons }) => {
    const client = db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(request.client_id);
    const category = db.prepare('SELECT name, slug FROM categories WHERE id = ?').get(request.category_id);
    return { ...request, client_name: client?.name, client_avatar: client?.avatar_url, category_name: category?.name, category_slug: category?.slug, matchReasons: reasons };
  });
  res.json({ requests });
}));

module.exports = router;
