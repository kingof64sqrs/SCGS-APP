/**
 * pm2 process definitions for the SCGS deployment.
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart scgs-backend --update-env
 *
 * scgs-backend      : Express API + static admin build, port 5000 (backend/.env)
 * scgs-admin        : admin panel host, port 3000, proxies /api -> 127.0.0.1:5000
 * scgs-tunnel-api   : Cloudflare quick tunnel -> port 5000 (public HTTPS)
 * scgs-tunnel-admin : Cloudflare quick tunnel -> port 3000 (public HTTPS)
 * MongoDB runs in Docker — see deploy/docker-compose.yml.
 *
 * Quick-tunnel URLs are EPHEMERAL: cloudflared is handed a new *.trycloudflare.com
 * hostname every time it restarts. Read the current ones with:
 *   ./deploy/tunnel-urls.sh
 */
const path = require('node:path');

const root = __dirname;
const logs = path.join(root, 'deploy', 'logs');

module.exports = {
  apps: [
    {
      name: 'scgs-backend',
      cwd: path.join(root, 'backend'),
      // tsx runs the TypeScript sources directly — no build step in this project.
      script: 'node_modules/.bin/tsx',
      args: 'src/main.ts',
      interpreter: 'none',
      env: { NODE_ENV: 'production', PORT: '5000' },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '600M',
      kill_timeout: 12000, // graceful shutdown closes the Mongo client first
      out_file: path.join(logs, 'backend-out.log'),
      error_file: path.join(logs, 'backend-error.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'scgs-admin',
      cwd: path.join(root, 'admin'),
      script: 'server.mjs',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        API_TARGET: 'http://127.0.0.1:5000',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '300M',
      out_file: path.join(logs, 'admin-out.log'),
      error_file: path.join(logs, 'admin-error.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'scgs-tunnel-api',
      script: 'cloudflared',
      args: 'tunnel --protocol http2 --url http://localhost:5000',
      interpreter: 'none',
      autorestart: true,
      restart_delay: 5000,
      out_file: path.join(logs, 'tunnel-api.log'),
      error_file: path.join(logs, 'tunnel-api.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'scgs-tunnel-admin',
      script: 'cloudflared',
      args: 'tunnel --protocol http2 --url http://localhost:3000',
      interpreter: 'none',
      autorestart: true,
      restart_delay: 5000,
      out_file: path.join(logs, 'tunnel-admin.log'),
      error_file: path.join(logs, 'tunnel-admin.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
