const cron = require('node-cron');
const medicationModel = require('../models/medicationModel');
const { predictShortage } = require('./shortagePrediction');

async function runDailyShortageCheck() {
  const meds = await medicationModel.listActive({});
  let changed = 0;

  for (const med of meds) {
    // listActive already includes the 30-day withdrawal total for each medication.
    const prediction = predictShortage({
      currentStock: med.current_stock,
      alertThresholdDays: med.alert_threshold_days,
      totalWithdrawn30d: med.total_withdrawn_30d,
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
