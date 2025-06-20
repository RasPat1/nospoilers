module.exports = {
  apps: [
    {
      name: 'nospoilers-app',
      script: './node_modules/.bin/next',
      args: 'dev -p 8080 -H 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      watch: ['app', 'components', 'lib', 'public'],
      ignore_watch: ['node_modules', '.next', '.git', 'logs', '*.log'],
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000
    },
    {
      name: 'nospoilers-websocket',
      script: './websocket-server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: ['websocket-server.js'],
      ignore_watch: ['node_modules', 'logs', '*.log'],
      env: {
        NODE_ENV: 'development',
        WS_PORT: 8081
      },
      error_file: './logs/ws-error.log',
      out_file: './logs/ws-out.log',
      log_file: './logs/ws-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000
    }
  ]
};