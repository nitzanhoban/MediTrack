const WINDOW_DAYS = 30;

const StockStatus = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
};

function predictShortage({ currentStock, alertThresholdDays, totalWithdrawn30d }) {
  const dailyRate = totalWithdrawn30d / WINDOW_DAYS;
  let daysRemaining = null;
  
  if (dailyRate > 0) {
    daysRemaining = currentStock / dailyRate;
  }

  let status;

  if (currentStock <= 0) {
    status = StockStatus.RED;
  } else if (daysRemaining !== null && daysRemaining <= alertThresholdDays) {
    status = StockStatus.YELLOW;
  } else {
    status = StockStatus.GREEN;
  }

  return {
    dailyRate,
    daysRemaining,
    status,
  };
}

module.exports = { predictShortage, WINDOW_DAYS, StockStatus };