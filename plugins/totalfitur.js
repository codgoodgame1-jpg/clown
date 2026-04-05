const fs = require('fs')
const path = require('path')

module.exports = {
  name: 'totalfitur',
  usage: 'totalfitur',
  description: 'Lihat total plugin yang aktif',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const pluginsDir = path.join(__dirname)
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

    let active = 0
    let inactive = 0
    const list = []

    for (const file of files) {
      const plugin = require(path.join(pluginsDir, file))
      if (plugin.isActive) {
        active++
        list.push(`   ⌑ ${plugin.name}`)
      } else {
        inactive++
      }
    }

    const text = `*• ────────────────── •*
      📦 Total Fitur
*• ────────────────── •*
  aktif    ›  ${active}
  nonaktif ›  ${inactive}
  total    ›  ${files.length}

  ◈ daftar plugin
${list.join('\n')}
*• ────────────────── •*`

    msg.reply(text)
  }
}
