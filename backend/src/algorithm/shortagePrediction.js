const WINDOW_DAYS = 30;

/**
 * Moving-average shortage prediction (CLAUDE.md section 8).
 *
 * 1. Sum withdrawals over the last 30 days.
 * 2. Divide by 30 -> average daily consumption rate.
 * 3. current_stock / rate -> days remaining until stockout.
 * 4. Classify status:
 *      red    - out of stock (current_stock <= 0)
 *      yellow - stock > 0 and days_remaining <= alert_threshold_days
 *      green  - otherwise (including zero/undetermined consumption, i.e.
 *               no withdrawals in the window -> nothing to predict from)
 *
 * `totalWithdrawn30d` is the sum of `quantity` for transaction_type='withdrawal'
 * in the last 30 days, computed by the caller (SQL aggregate) and passed in here
 * so this function stays a pure, easily-testable calculation.
 */
function predictShortage({ currentStock, alertThresholdDays, totalWithdrawn30d }) {
  const dailyRate = totalWithdrawn30d / WINDOW_DAYS;

  let daysRemaining = null; // null = cannot be determined (no consumption history)
  if (dailyRate > 0) {
    daysRemaining = currentStock / dailyRate;
  }

  let status;
  if (currentStock <= 0) {
    status = 'red';
  } else if (daysRemaining !== null && daysRemaining <= alertThresholdDays) {
    status = 'yellow';
  } else {
    status = 'green';
  }

  return {
    dailyRate,
    daysRemaining,
    status,
  };
}

module.exports = { predictShortage, WINDOW_DAYS };
