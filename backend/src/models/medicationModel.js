const { pool } = require('../config/db');

const BASE_SELECT_WITH_30D = `
  SELECT
    m.medication_id,
    m.name,
    m.current_stock,
    m.alert_threshold_days,
    m.status,
    m.department,
    m.is_active,
    m.created_at,
    m.updated_at,
    COALESCE(w.total_30d, 0)::int AS total_withdrawn_30d
  FROM medications m
  LEFT JOIN (
    SELECT medication_id, SUM(quantity) AS total_30d
    FROM withdrawal_transactions
    WHERE transaction_type = 'withdrawal'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY medication_id
  ) w ON w.medication_id = m.medication_id
`;

/** List active medications, each annotated with its trailing-30-day withdrawal total. */
async function listActive({ department } = {}) {
  const params = [];
  let where = 'WHERE m.is_active = TRUE';
  if (department) {
    params.push(department);
    where += ` AND m.department = $${params.length}`;
  }
  const { rows } = await pool.query(
    `${BASE_SELECT_WITH_30D} ${where} ORDER BY m.name ASC`,
    params
  );
  return rows;
}

async function getActiveById(medicationId) {
  const { rows } = await pool.query(
    `${BASE_SELECT_WITH_30D} WHERE m.is_active = TRUE AND m.medication_id = $1`,
    [medicationId]
  );
  return rows[0] || null;
}

/** Row lock variant for use inside a transaction (withdraw/restock). */
async function getForUpdate(client, medicationId) {
  const { rows } = await client.query(
    `SELECT medication_id, name, current_stock, alert_threshold_days, status, department, is_active
     FROM medications
     WHERE medication_id = $1 AND is_active = TRUE
     FOR UPDATE`,
    [medicationId]
  );
  return rows[0] || null;
}

async function listDistinctDepartments() {
  const { rows } = await pool.query(
    `SELECT DISTINCT department FROM medications WHERE is_active = TRUE AND department IS NOT NULL ORDER BY department`
  );
  return rows.map((r) => r.department);
}

async function create({ name, currentStock, alertThresholdDays, department, status }) {
  const { rows } = await pool.query(
    `INSERT INTO medications (name, current_stock, alert_threshold_days, department, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING medication_id, name, current_stock, alert_threshold_days, status, department, is_active, created_at, updated_at`,
    [name, currentStock, alertThresholdDays, department, status]
  );
  return rows[0];
}

/** Update stock + status for a medication, inside a transaction. */
async function updateStock(client, medicationId, { currentStock, status }) {
  const { rows } = await client.query(
    `UPDATE medications
     SET current_stock = $2, status = $3, updated_at = NOW()
     WHERE medication_id = $1
     RETURNING medication_id, name, current_stock, alert_threshold_days, status, department, is_active, created_at, updated_at`,
    [medicationId, currentStock, status]
  );
  return rows[0];
}

/** Update just status (used by the daily background recompute job — no stock change). */
async function updateStatus(medicationId, status) {
  await pool.query(
    `UPDATE medications SET status = $2, updated_at = NOW() WHERE medication_id = $1`,
    [medicationId, status]
  );
}

async function softDelete(medicationId) {
  const { rows } = await pool.query(
    `UPDATE medications SET is_active = FALSE, updated_at = NOW()
     WHERE medication_id = $1 AND is_active = TRUE
     RETURNING medication_id`,
    [medicationId]
  );
  return rows[0] || null;
}

module.exports = {
  listActive,
  getActiveById,
  getForUpdate,
  listDistinctDepartments,
  create,
  updateStock,
  updateStatus,
  softDelete,
};
