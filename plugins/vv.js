module.exports = {
  name: 'vv',
  usage: 'vv',
  description: 'Buka pesan sekali lihat',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Reply ke pesan sekali lihat dulu!',
      }, { quoted: msg })
    }

    const viewOnce =
      quoted?.viewOnceMessage?.message ||
      quoted?.viewOnceMessageV2?.message ||
      quoted?.viewOnceMessageV2Extension?.message

    if (!viewOnce) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Pesan yang di-reply bukan pesan sekali lihat!',
      }, { quoted: msg })
    }

    const type = Object.keys(viewOnce)[0]
    const content = viewOnce[type]

    await sock.sendMessage(remoteJid, {
      [type]: content,
    }, { quoted: msg })
  }
}
