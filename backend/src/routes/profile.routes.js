const express = require('express');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('./auth.routes');

const router = express.Router();

router.put('/', requireAuth, asyncHandler(async (req, res) => {
  const { name, phone, avatarSeed } = req.body;
  if (name || phone !== undefined || avatarSeed !== undefined) {
    db.prepare(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url), updated_at = datetime('now') WHERE id = ?`)
      .run(name || null, phone !== undefined ? phone : null, avatarSeed !== undefined ? avatarSeed : null, req.user.id);
  }

  if (req.user.role === 'client') {
    const { businessName, businessType, location, about } = req.body;
    const exists = db.prepare('SELECT user_id FROM client_profiles WHERE user_id = ?').get(req.user.id);
    if (exists) {
      db.prepare(`UPDATE client_profiles SET business_name = COALESCE(?, business_name), business_type = COALESCE(?, business_type), location = COALESCE(?, location), about = COALESCE(?, about) WHERE user_id = ?`)
        .run(businessName, businessType, location, about, req.user.id);
    } else {
      db.prepare('INSERT INTO client_profiles (user_id, business_name, business_type, location, about) VALUES (?,?,?,?,?)')
        .run(req.user.id, businessName || null, businessType || null, location || null, about || null);
    }
  } else if (req.user.role === 'provider') {
    const { providerType, headline, about, startingPrice, deliveryTimeDays, availability, location, remote, responseTime, skillIds, social } = req.body;
    db.prepare(
      `UPDATE provider_profiles SET
        provider_type = COALESCE(?, provider_type), headline = COALESCE(?, headline), about = COALESCE(?, about),
        starting_price = COALESCE(?, starting_price), delivery_time_days = COALESCE(?, delivery_time_days),
        availability = COALESCE(?, availability), location = COALESCE(?, location),
        remote = COALESCE(?, remote), response_time = COALESCE(?, response_time),
        social_links = COALESCE(?, social_links)
       WHERE user_id = ?`
    ).run(
      providerType, headline, about, startingPrice, deliveryTimeDays, availability, location,
      remote === undefined ? null : (remote ? 1 : 0), responseTime,
      social ? JSON.stringify(social) : null, req.user.id
    );

    if (Array.isArray(skillIds)) {
      db.prepare('DELETE FROM provider_skills WHERE provider_id = ?').run(req.user.id);
      const stmt = db.prepare('INSERT OR IGNORE INTO provider_skills (provider_id, skill_id) VALUES (?,?)');
      for (const sid of skillIds) stmt.run(req.user.id, sid);
    }
  }

  res.json({ user: publicUser(req.user.id) });
}));

module.exports = router;
