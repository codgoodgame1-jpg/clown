const fs = require('fs')
const path = require('path')

const settingsPath = path.join(__dirname, '../database/settings.json')
const readDB = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
const writeDB = (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2))

module.exports = {
  name: 'setwelcome',
  usage: 'welcome',
  description: 'Toggle welcome message on/off',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const sub = args[0]?.toLowerCase()
    if (!sub || !['on', 'off'].includes(sub)) {
      return msg.reply('⚠️ Format salah!\nContoh: ;welcome on / ;welcome off')
    }

    const db = readDB()
    db.welcome = sub
    writeDB(db)

    msg.reply(`✅ Welcome message: *${sub.toUpperCase()}*`)
  }
}
