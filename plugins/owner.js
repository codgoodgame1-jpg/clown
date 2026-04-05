const ownerInfo = require('../database/owner.js')

module.exports = {
  name: 'owner',
  usage: 'owner',
  description: 'Info tentang bot & owner',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const text = `*• ────────────────── •*
      ℹ️  Info Bot
*• ────────────────── •*
  ${ownerInfo.credit}

  ${ownerInfo.contact}
*• ────────────────── •*`

    msg.reply(text)
  }
}
