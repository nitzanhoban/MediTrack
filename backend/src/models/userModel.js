const { pool } = require('../config/db');

const VALID_ROLES = ['pharmacist', 'admin'];

async function findByUsername(username) {
  const { rows } = await pool.query(
    'SELECT user_id, username, password_hash, role, created_at FROM users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
}

async function findById(userId) {
  const { rows } = await pool.query(
    'SELECT user_id, username, role, created_at FROM users WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function create({ username, passwordHash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, role, created_at`,
    [username, passwordHash, role]
  );
  return rows[0];
}

module.exports = { findByUsername, findById, create, VALID_ROLES };
