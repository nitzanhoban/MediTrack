/* eslint-disable no-console */
// Optional demo-data script — NOT run automatically by `npm run db:seed`.
// Run manually with: npm run db:seed:demo-medications --workspace=backend
//
// Inserts five sample medications spanning all three status colors, so the
// dashboard has something to look at without having to create medications
// by hand through the UI first. Kept separate from seed.js (which only
// creates the two dev users) so the interface reflects real, user-created
// data by default — this is here for demos/emergencies, not routine setup.
const { pool } = require('../src/config/db');

async function seedDemoMedications() {
  const meds = [
    ['Amoxicillin 500mg', 500, 'capsules', 5, 'Pharmacy'],
    ['Insulin Glargine', 40, 'vials', 5, 'ICU'],
    ['Morphine 10mg/mL', 15, 'ampoules', 5, 'ER'],
    ['Paracetamol 500mg', 1000, 'tablets', 5, 'Pharmacy'],
    ['Amiodarone 150mg', 0, 'ampoules', 5, 'ICU'],
  ];

  for (const [name, currentStock, unit, alertThresholdDays, department] of meds) {
    const status = currentStock <= 0 ? 'red' : 'green';
    await pool.query(
      `INSERT INTO medications (name, current_stock, unit, alert_threshold_days, department, status)
       SELECT $1::varchar, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (SELECT 1 FROM medications WHERE name = $1::varchar)`,
      [name, currentStock, unit, alertThresholdDays, department, status]
    );
  }

  console.log(`Seeded ${meds.length} demo medications (skipped any that already existed by name).`);
  await pool.end();
}

seedDemoMedications().catch((err) => {
  console.error('Demo medication seed failed:', err);
  process.exit(1);
});
