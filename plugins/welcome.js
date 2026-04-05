module.exports = {
  name: 'welcome',
  usage: null,
  description: 'Welcome & goodbye member grup',
  isOwner: false,
  isActive: true,

  run: async () => {},

  onGroupUpdate: async (sock, update, settings) => {
    const { id, participants, action } = update
    try {
      const groupMeta = await sock.groupMetadata(id)
      const groupName = groupMeta.subject

      for (const participant of participants) {
        const username = participant.split('@')[0]

        if (action === 'add' && settings.welcome === 'on') {
          await sock.sendMessage(id, {
            text: `*• ────────────────── •*\n👋 Selamat datang @${username}!\n\nKamu baru aja join *${groupName}*\nMohon baca & patuhi peraturan grup ya 🙏\n*• ────────────────── •*`,
            mentions: [participant],
          })
        } else if (action === 'remove' && settings.goodbye === 'on') {
          await sock.sendMessage(id, {
            text: `*• ────────────────── •*\n👋 Sampai jumpa @${username}!\n\nTerima kasih udah gabung di *${groupName}* 😊\n*• ────────────────── •*`,
            mentions: [participant],
          })
        }
      }
    } catch (err) {
      console.error('Error welcome plugin:', err.message)
    }
  }
}
