const cron = require('node-cron');
const medicationModel = require('../models/medicationModel');
const { predictShortage } = require('./shortagePrediction');

async function runDailyShortageCheck() {
  const meds = await medicationModel.listActive({});

  for (const med of meds) {
    const prediction = predictShortage({
      currentStock: med.current_stock,
      alertThresholdDays: med.alert_threshold_days,
      totalWithdrawn30d: med.total_withdrawn_30d,
    });
    if (prediction.status !== med.status) {
      await medicationModel.updateStatus(med.medication_id, prediction.status);
    }
  }
}

/** Schedules the job for 03:00 daily. Call once at startup. */
function scheduleDailyShortageCheck() {
  cron.schedule('0 3 * * *', () => {
    runDailyShortageCheck().catch((err) => {
      console.error('dailyShortageCheck failed', err);
    });
  });
}

module.exports = { scheduleDailyShortageCheck };
