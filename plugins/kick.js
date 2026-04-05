module.exports = {
  name: 'kick',
  usage: 'kick',
  description: 'Kick member dari grup',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid, isGroup }) => {
    if (!isGroup) {
      return await sock.sendMessage(remoteJid, {
        text: '⛔ Command ini hanya bisa digunakan di grup!',
      }, { quoted: msg })
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
    if (!mentioned || mentioned.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Tag dulu orangnya!\nContoh: .kick @username',
      }, { quoted: msg })
    }

    for (const target of mentioned) {
      await sock.groupParticipantsUpdate(remoteJid, [target], 'remove')
    }

    await sock.sendMessage(remoteJid, {
      text: `✅ Berhasil kick ${mentioned.length} member.`,
    }, { quoted: msg })
  }
}
