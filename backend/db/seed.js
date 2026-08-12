/* eslint-disable no-console */
// Dev seed script. Run with: npm run db:seed --workspace=backend
// Creates two test users (password "password123" for both) and five
// medications spanning all three status colors, so the dashboard has
// something meaningful to show on first run.
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

  const meds = [
    ['Amoxicillin 500mg', 500, 5, 'Pharmacy'],
    ['Insulin Glargine', 40, 5, 'ICU'],
    ['Morphine 10mg/mL', 15, 5, 'ER'],
    ['Paracetamol 500mg', 1000, 5, 'Pharmacy'],
    ['Amiodarone 150mg', 0, 5, 'ICU'],
  ];

  for (const [name, currentStock, alertThresholdDays, department] of meds) {
    const status = currentStock <= 0 ? 'red' : 'green';
    await pool.query(
      `INSERT INTO medications (name, current_stock, alert_threshold_days, department, status)
       SELECT $1::varchar, $2, $3, $4, $5
       WHERE NOT EXISTS (SELECT 1 FROM medications WHERE name = $1::varchar)`,
      [name, currentStock, alertThresholdDays, department, status]
    );
  }

  console.log(`Seed complete. Dev users: admin / pharmacist1, password: "${DEV_PASSWORD}"`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
