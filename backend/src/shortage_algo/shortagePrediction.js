const { StockStatus } = require('../utils/consts');

const WINDOW_DAYS = 30;

const STATUS_RULES = [
  {
    status: StockStatus.RED,
    matches: ({ currentStock }) => currentStock <= 0,
  },
  {
    status: StockStatus.YELLOW,
    matches: ({ currentStock, daysRemaining, alertThresholdDays }) =>
      currentStock > 0 && daysRemaining !== null && daysRemaining <= alertThresholdDays,
  },
  {
    status: StockStatus.GREEN,
    matches: () => true,
  },
];

function classifyStatus(context) {
  const rule = STATUS_RULES.find((r) => r.matches(context));
  return rule.status;
}

/**
 * Moving-average shortage prediction (CLAUDE.md section 8).
 *
 * 1. Sum withdrawals over the last 30 days.
 * 2. Divide by 30 -> average daily consumption rate.
 * 3. current_stock / rate -> days remaining until stockout.
 * 4. Classify status via STATUS_RULES (see above).
 *
 * `totalWithdrawn30d` is the sum of `quantity` for transaction_type='withdrawal'
 * in the last 30 days, computed by the caller (SQL aggregate) and passed in here
 * so this function stays a pure, easily-testable calculation.
 */
function predictShortage({ currentStock, alertThresholdDays, totalWithdrawn30d }) {
  const dailyRate = totalWithdrawn30d / WINDOW_DAYS;

  let daysRemaining = null; 

  if (dailyRate > 0) {
    daysRemaining = currentStock / dailyRate;
  }

  const status = classifyStatus({ currentStock, alertThresholdDays, dailyRate, daysRemaining });

  return {
    dailyRate,
    daysRemaining,
    status,
  };
}

module.exports = { predictShortage, WINDOW_DAYS, StockStatus, STATUS_RULES };
