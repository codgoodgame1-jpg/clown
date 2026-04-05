const fs = require('fs')
const path = require('path')

const settingsPath = path.join(__dirname, '../database/settings.json')
const readDB = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
const writeDB = (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2))

module.exports = {
  name: 'botonoff',
  usage: 'bot',
  description: 'Pause/aktifkan bot',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const sub = args[0]?.toLowerCase()
    if (!sub || !['on', 'off'].includes(sub)) {
      return msg.reply('⚠️ Format salah!\nContoh: ;bot on / ;bot off')
    }

    const db = readDB()
    db.botActive = sub === 'on'
    writeDB(db)

    msg.reply(`✅ Bot sekarang: *${sub === 'on' ? 'AKTIF 🟢' : 'PAUSE 🔴'}*`)
  }
}
