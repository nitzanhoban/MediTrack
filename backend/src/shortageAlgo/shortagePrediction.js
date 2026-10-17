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

module.exports = { predictShortage, STATUS_RULES };
