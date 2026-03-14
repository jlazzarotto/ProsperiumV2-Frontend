const path = require('path')

module.exports = {
  apps: [
    {
      name: 'prosperium-frontend',
      script: 'npm',
      args: 'start',
      cwd: path.resolve(__dirname),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
      },
    },
  ],
}
