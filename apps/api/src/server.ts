import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import os from 'os'
import app from './app'

const PORT = parseInt(process.env.PORT || '3001')
const HOST = process.env.HOST || '0.0.0.0'

// Ensure uploads directory exists
const uploadDir = path.resolve(process.env.UPLOAD_LOCAL_PATH || './uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 API rodando em http://localhost:${PORT}/api/v1`)

  // Show local network IPs for mobile access
  const nets = os.networkInterfaces()
  for (const iface of Object.values(nets)) {
    for (const net of iface || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`📱 Rede local: http://${net.address}:${PORT}/api/v1`)
      }
    }
  }

  console.log(`\n✅ Health check: http://localhost:${PORT}/health\n`)
})
