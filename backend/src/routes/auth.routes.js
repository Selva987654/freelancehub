const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { id } = require('../utils/ids');
const { signToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { DEMO_PASSWORD } = require('../db/seed');

const router = express.Router();

function publicUser(userId) {
  const user = db.prepare(
    'SELECT id, email, name, role, avatar_url, phone, created_at FROM users WHERE id = ?'
  ).get(userId);
  if (!user) return null;
  if (user.role === 'client') {
    user.clientProfile = db.prepare('SELECT * FROM client_profiles WHERE user_id = ?').get(userId) || null;
  } else if (user.role === 'provider') {
    const pp = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(userId);
    if (pp) {
      pp.social_links = pp.social_links ? JSON.parse(pp.social_links) : {};
      pp.skills = db.prepare(
        `SELECT s.id, s.name FROM provider_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.provider_id = ?`
      ).all(userId);
    }
    user.providerProfile = pp || null;
  }
  return user;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name, role, businessName, businessType, location, providerType } = req.body;

  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address.');
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');
  if (!name || !name.trim()) throw new ApiError(400, 'Please enter your name.');
  if (!['client', 'provider'].includes(role)) throw new ApiError(400, 'Please choose whether you need help or want to help.');

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const uid = id('usr');
  const passwordHash = bcrypt.hashSync(password, 8);
  db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?,?,?,?,?)')
    .run(uid, email.toLowerCase(), passwordHash, name.trim(), role);

  if (role === 'client') {
    db.prepare('INSERT INTO client_profiles (user_id, business_name, business_type, location, about) VALUES (?,?,?,?,?)')
      .run(uid, businessName || null, businessType || null, location || null, null);
  } else {
    db.prepare(
      `INSERT INTO provider_profiles (user_id, provider_type, headline, about, starting_price, delivery_time_days, availability, location, remote, response_time, verified, rating_avg, rating_count, completed_projects, social_links)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(uid, providerType || 'Beginner', null, null, 0, 7, 'Available', location || null, 1, 'Within a day', 0, 0, 0, 0, '{}');
  }

  const token = signToken({ sub: uid, role });
  res.status(201).json({ token, user: publicUser(uid) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Please enter your email and password.');
  const row = db.prepare('SELECT id, password_hash, is_active FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !row.is_active || !bcrypt.compareSync(password, row.password_hash)) {
    throw new ApiError(401, 'Incorrect email or password.');
  }
  const token = signToken({ sub: row.id });
  res.json({ token, user: publicUser(row.id) });
}));

// Demo login lets visitors explore the product without creating an account.
const DEMO_ACCOUNTS = {
  business: 'arun@aruncafe.demo',
  student: 'rahul@dev.demo',
  professional: 'arjun@fullstack.demo',
  admin: 'admin@freelancerhub.demo',
};

router.post('/demo-login', asyncHandler(async (req, res) => {
  const { persona } = req.body;
  const email = DEMO_ACCOUNTS[persona];
  if (!email) throw new ApiError(400, 'Unknown demo persona. Choose business, student, professional or admin.');
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!row) throw new ApiError(500, 'Demo account is not seeded yet.');
  const token = signToken({ sub: row.id });
  res.json({ token, user: publicUser(row.id), demoPassword: DEMO_PASSWORD });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user.id) });
}));

module.exports = { router, publicUser };
