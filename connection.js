const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const config = require('./config')

class WAConnection {
  constructor() {
    this.sock = null
    this.onMessage = null
    this.onGroupUpdate = null
    this.isReady = false
    this.startTime = null // waktu bot start
  }

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session')
    const { version } = await fetchLatestBaileysVersion()

    this.startTime = Math.floor(Date.now() / 1000) // timestamp sekarang (detik)

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Firefox', '120.0.0'],
      printQRInTerminal: false,
      syncFullHistory: false, // jangan load history lama
      getMessage: async () => ({ conversation: '' }),
    })

    this.sock.ev.on('creds.update', saveCreds)

    // Pairing code
    if (!this.sock.authState.creds.registered) {
      const number = config.pairingNumber.replace(/[^0-9]/g, '')
      await new Promise(r => setTimeout(r, 3000))
      const code = await this.sock.requestPairingCode(number)
      console.log(`\n🔑 Pairing Code: ${code}\n`)
      setTimeout(() => process.exit(0), 30000) // restart otomatis 30 detik setelah pairing
    }

    // Handle koneksi
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'close') {
        this.isReady = false
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
        const shouldReconnect = reason !== DisconnectReason.loggedOut

        console.log(`⚠️  Koneksi terputus. Reason: ${reason}`)
        if (shouldReconnect) {
          console.log('🔄 Reconnecting dalam 5 detik...')
          await new Promise(r => setTimeout(r, 5000))
          this.connect()
        } else {
          console.log('❌ Logged out. Hapus folder auth_session dan restart.')
        }
      } else if (connection === 'open') {
        console.log(`✅ ${config.botName} berhasil terhubung! Menunggu sinkronisasi...`)
        await new Promise(r => setTimeout(r, 5000))
        this.isReady = true
        console.log(`🟢 Bot siap menerima pesan!`)
      }
    })

    // Forward pesan ke handler (hanya kalau ready & pesan baru)
    this.sock.ev.on('messages.upsert', (data) => {
      if (!this.isReady) return

      // Filter pesan lama — hanya proses pesan setelah bot start
      const msg = data.messages[0]
      // const msgTimestamp = msg?.messageTimestamp
      // if (msgTimestamp && msgTimestamp < this.startTime) return

      if (this.onMessage) this.onMessage(data)
    })

    // Forward group update ke handler (hanya kalau ready)
    this.sock.ev.on('group-participants.update', (data) => {
      if (!this.isReady) return
      if (this.onGroupUpdate) this.onGroupUpdate(data)
    })

    return this.sock
  }

  getSocket() {
    return this.sock
  }
}

module.exports = WAConnection
