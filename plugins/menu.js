const path = require('path')
const fs = require('fs')

module.exports = {
  name: 'menu',
  usage: 'menu',
  description: 'Nampilin list menu bot',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { config, settings, remoteJid }) => {
    const text = `*• ────────────────── •*
      🤖 ${config.botName}
*• ────────────────── •*
  owner  ›  ${config.ownerName}
  dev    ›  ${config.devName}

  ◈ general
   ⌑ .menu
   ⌑ .ping
   ⌑ .ai

  ◈ media
   ⌑ .play
   ⌑ .aio
   ⌑ .pins
   ⌑ .sticker
   ⌑ .brat
   ⌑ .bratvid
   ⌑ .convert

  ◈ group
   ⌑ .kick
   ⌑ .open
   ⌑ .close
   ⌑ .jdwgc
   ⌑ .vv

  ◈ owner only
   ⌑ .$

*• ────────────────── •*`

    await sock.sendMessage(remoteJid, { text }, { quoted: msg })

    // Kirim audio jika audio = on
    if (settings.audio === 'on') {
      const audioPath = path.join(__dirname, '../asset/audio/menu.mp3')
      if (fs.existsSync(audioPath)) {
        await sock.sendMessage(remoteJid, {
          audio: { url: audioPath },
          mimetype: 'audio/mp4',
          ptt: false,
        })
      }
    }
  }
}
