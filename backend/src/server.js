const app = require('./app');
const env = require('./config/env');
const { scheduleDailyShortageCheck } = require('./jobs/dailyShortageCheck');

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`MediTrack backend listening on port ${env.port} (${env.nodeEnv})`);
  scheduleDailyShortageCheck();
});
