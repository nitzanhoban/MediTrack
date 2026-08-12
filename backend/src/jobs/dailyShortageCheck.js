const cron = require('node-cron');
const medicationModel = require('../models/medicationModel');
const transactionModel = require('../models/transactionModel');
const { predictShortage } = require('../algorithm/shortagePrediction');

/**
 * Periodic safety net (CLAUDE.md section 8): recomputes status for every
 * active medication once a day, independent of manual withdraw/restock
 * actions, so the 30-day window rolls forward even with no new transactions.
 */
async function runDailyShortageCheck() {
  const meds = await medicationModel.listActive({});
  let changed = 0;

  for (const med of meds) {
    const total30d = await transactionModel.sumWithdrawals30d(med.medication_id);
    const prediction = predictShortage({
      currentStock: med.current_stock,
      alertThresholdDays: med.alert_threshold_days,
      totalWithdrawn30d: total30d,
    });
    if (prediction.status !== med.status) {
      await medicationModel.updateStatus(med.medication_id, prediction.status);
      changed += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[dailyShortageCheck] checked ${meds.length} medications, ${changed} status changes`);
  return { checked: meds.length, changed };
}

/** Schedules the job for 03:00 server time daily. Call once at startup. */
function scheduleDailyShortageCheck() {
  cron.schedule('0 3 * * *', () => {
    runDailyShortageCheck().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[dailyShortageCheck] failed', err);
    });
  });
}

module.exports = { runDailyShortageCheck, scheduleDailyShortageCheck };
