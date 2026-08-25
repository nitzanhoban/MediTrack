const WINDOW_DAYS = 30;

const StockStatus = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
};

/**
 * Ordered status rules — evaluated top to bottom, first match wins.
 *
 * This is the open/closed extension point for classification: to add a new
 * status (a new color, a new urgency tier, whatever), add a rule object
 * here. Nothing else in this file — `predictShortage`, the daily-rate/
 * days-remaining math, or any caller — needs to change. Order matters:
 * put more urgent/specific rules before more general ones, and always
 * keep a catch-all rule last so classification can never fall through
 * with no status.
 *
 * Each rule receives the same context object `predictShortage` computes:
 * { currentStock, alertThresholdDays, dailyRate, daysRemaining }.
 */
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
    matches: () => true, // catch-all — must stay last
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

  let daysRemaining = null; // null = cannot be determined (no consumption history)
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
