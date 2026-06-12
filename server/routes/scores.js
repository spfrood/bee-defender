'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const db = require('../../database/db');

const router = express.Router();

// Server-side salt for IP hashing — plaintext IPs are never stored.
// Never committed: comes from the environment, or a random value
// generated once and persisted in the gitignored data/ directory.
const SALT_PATH = path.join(__dirname, '..', '..', 'data', '.salt');

function loadSalt() {
  if (process.env.SCORE_SALT) return process.env.SCORE_SALT;
  try {
    return fs.readFileSync(SALT_PATH, 'utf8').trim();
  } catch (err) {
    const salt = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(path.dirname(SALT_PATH), { recursive: true });
    fs.writeFileSync(SALT_PATH, salt, { mode: 0o600 });
    return salt;
  }
}

const SALT = loadSalt();

const USERNAME_RE = /^[A-Za-z0-9 _-]+$/;

function hashIp(ip) {
  return crypto.createHash('sha256').update(ip + SALT).digest('hex');
}

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const getLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/score', postLimiter, (req, res) => {
  const { username, score, level } = req.body || {};

  if (
    typeof username !== 'string' ||
    username.length < 1 ||
    username.length > 20 ||
    !USERNAME_RE.test(username)
  ) {
    return res.status(400).json({ error: 'Invalid username' });
  }

  if (!Number.isInteger(score) || score < 0 || score > 9999999) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  if (!Number.isInteger(level) || level < 1 || level > 10000) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  const ipHash = hashIp(req.ip || '');

  const insert = db.prepare(
    'INSERT INTO scores (username, score, level, ip_hash) VALUES (?, ?, ?, ?)'
  );
  insert.run(username, score, level, ipHash);

  const { higher } = db
    .prepare('SELECT COUNT(*) AS higher FROM scores WHERE score > ?')
    .get(score);
  const rank = higher + 1;

  res.json({ rank, username, score, level });
});

router.get('/leaderboard', getLimiter, (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    limit = 20;
  }

  const rows = db
    .prepare(
      'SELECT username, score, level, created_at FROM scores ORDER BY score DESC LIMIT ?'
    )
    .all(limit);

  const entries = rows.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    score: row.score,
    level: row.level,
    date: row.created_at
  }));

  res.json(entries);
});

module.exports = router;
