/* eslint-disable no-console */
// Dev seed script. Run with: npm run db:seed --workspace=backend
// Creates two test users (password "password123" for both). Deliberately
// does NOT create any sample medications — the dashboard should only ever
// show real, user-created data. For a quick demo/emergency fill of sample
// medications, run seed-demo-medications.js separately instead.
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

const DEV_PASSWORD = 'password123';

async function seed() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, 'admin'), ($3, $2, 'pharmacist')
     ON CONFLICT (username) DO NOTHING`,
    ['admin', passwordHash, 'pharmacist1']
  );

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
