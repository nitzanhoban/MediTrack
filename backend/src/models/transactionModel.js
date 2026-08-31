const { pool } = require('../config/db');
const { WITHDRAWAL } = require('../utils/consts');


async function insert(client, { medicationId, userId, quantity, department, type }) {
  const { rows } = await client.query(
    `INSERT INTO withdrawal_transactions (medication_id, user_id, quantity, department, transaction_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING transaction_id, medication_id, user_id, quantity, department, transaction_type, created_at`,
    [medicationId, userId, quantity, department, type]
  );
  return rows[0];
}

async function sumWithdrawals30d(medicationId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS total
     FROM withdrawal_transactions
     WHERE medication_id = $1
       AND transaction_type = $2
       AND created_at >= NOW() - INTERVAL '30 days'`,
    [medicationId, WITHDRAWAL]
  );
  return rows[0].total;
}

module.exports = { insert, sumWithdrawals30d };
