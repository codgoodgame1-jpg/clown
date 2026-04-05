const fs = require('fs')
const path = require('path')
const config = require('./config')

const settingsPath = path.join(__dirname, 'database/settings.json')
const getSettings = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

const pluginsDir = path.join(__dirname, 'plugins')
const plugins = []

const loadPlugins = () => {
  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
  for (const file of files) {
    const plugin = require(path.join(pluginsDir, file))
    if (plugin.isActive) {
      plugins.push(plugin)
      console.log(`  ✔ Plugin loaded: ${plugin.name}`)
    } else {
      console.log(`  ✖ Plugin skipped (inactive): ${plugin.name}`)
    }
  }
  console.log(`\n📦 Total plugins: ${plugins.length}\n`)
}

const handleMessage = async (sock, { messages }) => {
  const msg = messages[0]
  if (!msg.message || msg.key.fromMe) return
  if (!sock?.user) return

  // Baca settings fresh setiap pesan (biar perubahan on/off langsung efek)
  const settings = getSettings()

  // Cek bot aktif atau tidak
  if (!settings.botActive) return

  const sender = msg.key.participant || msg.key.remoteJid
  const remoteJid = msg.key.remoteJid
  const isGroup = remoteJid.endsWith('@g.us')

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''

  if (!text) return

  const senderNum = sender.replace('@s.whatsapp.net', '').replace('@g.us', '')
  const location = isGroup ? `[GC: ${remoteJid.replace('@g.us', '')}]` : '[DM]'
  console.log(`📨 ${location} ${senderNum}: ${text}`)

  const prefix = config.prefix
  if (!text.startsWith(prefix)) return

  const [rawCmd, ...args] = text.slice(prefix.length).trim().split(/\s+/)
  const cmd = rawCmd.toLowerCase()

  const plugin = plugins.find(p => p.usage === cmd || p.usage === `${prefix}${cmd}`)
  if (!plugin) return

  console.log(`⚡ Command: ${prefix}${cmd} | By: ${senderNum}`)

  msg.reply = (text) => sock.sendMessage(remoteJid, { text }, { quoted: msg })

  const ownerList = settings.ownerNumber || config.ownerNumber
  const isOwner = ownerList.includes(sender.replace(/[^0-9]/g, ''))

  if (plugin.isOwner && !isOwner) {
    return msg.reply('⛔ Command ini hanya bisa digunakan oleh owner!')
  }

  try {
    await plugin.run(sock, msg, args, { isOwner, isGroup, sender, remoteJid, settings, config })
    console.log(`✅ Plugin ${plugin.name} selesai`)
  } catch (err) {
    console.error(`❌ Error plugin ${plugin.name}:`, err.message)
    msg.reply(`❌ Error: ${err.message}`)
  }
}

const handleGroupUpdate = async (sock, update) => {
  const settings = getSettings()
  const welcomePlugin = plugins.find(p => p.name === 'welcome')
  if (welcomePlugin) {
    try {
      await welcomePlugin.onGroupUpdate(sock, update, settings)
    } catch (err) {
      console.error('❌ Error welcome plugin:', err.message)
    }
  }
}

module.exports = { loadPlugins, handleMessage, handleGroupUpdate }
