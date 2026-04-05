const fs = require('fs')
const path = require('path')

// Cek database/owner.js sebelum bot start
const ownerPath = path.join(__dirname, 'database/owner.js')
if (!fs.existsSync(ownerPath)) {
  console.error('❌ FATAL: database/owner.js tidak ditemukan! Bot tidak bisa dijalankan.')
  process.exit(1)
}

const WAConnection = require('./connection')
const { loadPlugins, handleMessage, handleGroupUpdate } = require('./handler')

const start = async () => {
  console.log('🚀 Starting bot...\n')
  console.log('📂 Loading plugins...')

  loadPlugins()

  const wa = new WAConnection()
  const sock = await wa.connect()

  wa.onMessage = (data) => handleMessage(sock, data)
  wa.onGroupUpdate = (data) => handleGroupUpdate(sock, data)
}

start()
