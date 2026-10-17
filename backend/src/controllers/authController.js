const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const env = require('../config/env');

const SALT_ROUNDS = 10;

const REFRESH_COOKIE_NAME = 'meditrack_refresh_token';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_REFRESH_EXPIRES_IN default
};

function toPublicUser(user) {
  return { userId: user.user_id, username: user.username, role: user.role };
}

async function register(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { username, password, role } = req.body;
  const existing = await userModel.findByUsername(username);

  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.create({
    username,
    passwordHash,
    role: role && userModel.VALID_ROLES.includes(role) ? role : 'pharmacist',
  });

  return res.status(201).json({ user: toPublicUser(user) });
}

async function login(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { username, password } = req.body;
  const user = await userModel.findByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);

  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTS);
  return res.json({ accessToken, user: toPublicUser(user) });
}

async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await userModel.findById(payload.sub);
  
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTS);

  return res.json({ accessToken, user: toPublicUser(user) });
}

async function logout(req, res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  return res.status(204).send();
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user: toPublicUser(user) });
}

module.exports = { register, login, refresh, logout, me, REFRESH_COOKIE_NAME };
