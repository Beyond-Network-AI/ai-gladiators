
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      '8350e960-92a3-48ce-9776-ac2c440c05bb-00-2xzfa4k2go4rt.kirk.replit.dev',
      '.replit.dev',
      '.repl.co'
    ]
  }
})
