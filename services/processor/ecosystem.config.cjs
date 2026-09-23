// pm2 configuration for the SkillsGap processor.
//
//   pm2 start ecosystem.config.cjs
//   pm2 restart skillsgap-processor   # rebuilds via run.sh
//   pm2 stop skillsgap-processor
//
// The app loads its own ./.env through loadLocalEnv() (dotenv.go), so no
// secrets belong in this file.
module.exports = {
  apps: [
    {
      name: 'skillsgap-processor',
      script: './run.sh',
      interpreter: '/bin/bash',
      cwd: __dirname,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '15s',
      // main.go allows up to 10s for graceful HTTP shutdown before pm2 escalates.
      kill_timeout: 12000,
      time: true,
      merge_logs: true,
    },
  ],
};
