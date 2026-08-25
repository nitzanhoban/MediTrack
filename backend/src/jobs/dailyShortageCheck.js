const cron = require('node-cron');
const medicationModel = require('../models/medicationModel');
const transactionModel = require('../models/transactionModel');
const { predictShortage } = require('../algorithm/shortagePrediction');

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

  return { checked: meds.length, changed };
}

/** Schedules the job for 03:00 daily. Call once at startup. */
function scheduleDailyShortageCheck() {
  cron.schedule('0 3 * * *', () => {
    runDailyShortageCheck().catch((err) => {
      console.error('dailyShortageCheck failed', err);
    });
  });
}

module.exports = { runDailyShortageCheck, scheduleDailyShortageCheck };
