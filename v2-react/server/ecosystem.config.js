module.exports = {
  apps: [
    {
      name: 'packing-api',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
      // Write structured JSON logs so monitoring service can parse them
      out_file: './logs/app-out.log',
      error_file: './logs/app-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};

/*
 * Setup commands:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup          <- follow the printed command to survive reboots
 *   pm2 logs packing-api
 *   pm2 monit
 */
