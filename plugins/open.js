module.exports = {
  name: 'open',
  usage: 'open',
  description: 'Buka grup (semua member bisa chat)',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid, isGroup }) => {
    if (!isGroup) {
      return await sock.sendMessage(remoteJid, {
        text: '⛔ Command ini hanya bisa digunakan di grup!',
      }, { quoted: msg })
    }

    await sock.groupSettingUpdate(remoteJid, 'not_announcement')
    await sock.sendMessage(remoteJid, {
      text: '🔓 Grup dibuka! Semua member sekarang bisa chat.',
    }, { quoted: msg })
  }
}
