// PM2 ecosystem — run all three services from the repo root:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (follow printed command to enable auto-start on reboot)
//
// Individual service control:
//   pm2 restart packing-api
//   pm2 restart packing-monitor
//   pm2 restart packing-bot
//   pm2 logs packing-api --lines 100

module.exports = {
  apps: [
    {
      name: 'packing-api',
      cwd:  './v2-react/server',
      script: 'src/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT:     '3001',
      },
      error_file: './logs/api-error.log',
      out_file:   './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'packing-monitor',
      cwd:  './monitoring',
      script: 'index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/monitor-error.log',
      out_file:   './logs/monitor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      // Cloudflare Tunnel — exposes localhost:3001 to packinglist.bakudanramen.com/api
      name: 'packing-tunnel',
      script: 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
      args:   'tunnel --no-autoupdate run',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '128M',
      error_file: './logs/tunnel-error.log',
      out_file:   './logs/tunnel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'packing-bot',
      cwd:  './telegram',
      script: 'index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/bot-error.log',
      out_file:   './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
