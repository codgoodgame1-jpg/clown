module.exports = {
  name: 'close',
  usage: 'close',
  description: 'Tutup grup (hanya admin yang bisa chat)',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid, isGroup }) => {
    if (!isGroup) {
      return await sock.sendMessage(remoteJid, {
        text: '⛔ Command ini hanya bisa digunakan di grup!',
      }, { quoted: msg })
    }

    await sock.groupSettingUpdate(remoteJid, 'announcement')
    await sock.sendMessage(remoteJid, {
      text: '🔒 Grup ditutup! Hanya admin yang bisa chat.',
    }, { quoted: msg })
  }
}
