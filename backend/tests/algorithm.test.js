const { predictShortage } = require('../src/algorithm/shortagePrediction');

describe('predictShortage', () => {
  test('red when out of stock, regardless of consumption history', () => {
    const result = predictShortage({ currentStock: 0, alertThresholdDays: 5, totalWithdrawn30d: 60 });
    expect(result.status).toBe('red');
  });

  test('red when out of stock even with zero consumption history', () => {
    const result = predictShortage({ currentStock: 0, alertThresholdDays: 5, totalWithdrawn30d: 0 });
    expect(result.status).toBe('red');
  });

  test('green when no withdrawals in the last 30 days (no consumption to predict from)', () => {
    const result = predictShortage({ currentStock: 100, alertThresholdDays: 5, totalWithdrawn30d: 0 });
    expect(result.status).toBe('green');
    expect(result.daysRemaining).toBeNull();
  });

  test('yellow when days remaining falls at or below the threshold', () => {
    // 150 units withdrawn over 30 days -> 5/day. Stock 20 -> 4 days remaining <= threshold 5.
    const result = predictShortage({ currentStock: 20, alertThresholdDays: 5, totalWithdrawn30d: 150 });
    expect(result.dailyRate).toBe(5);
    expect(result.daysRemaining).toBe(4);
    expect(result.status).toBe('yellow');
  });

  test('yellow at the exact threshold boundary (days_remaining == threshold)', () => {
    // 30 units over 30 days -> 1/day. Stock 5 -> exactly 5 days remaining == threshold.
    const result = predictShortage({ currentStock: 5, alertThresholdDays: 5, totalWithdrawn30d: 30 });
    expect(result.daysRemaining).toBe(5);
    expect(result.status).toBe('yellow');
  });

  test('green when days remaining is comfortably above the threshold', () => {
    // 30 units over 30 days -> 1/day. Stock 500 -> 500 days remaining.
    const result = predictShortage({ currentStock: 500, alertThresholdDays: 5, totalWithdrawn30d: 30 });
    expect(result.status).toBe('green');
  });
});
