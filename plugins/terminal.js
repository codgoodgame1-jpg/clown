const { exec } = require('child_process')

module.exports = {
  name: '$',
  usage: '$',
  description: 'Akses terminal lewat WA (owner only)',
  isOwner: true,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const command = args.join(' ')
    if (!command) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan command!\nContoh: .$ ls -la',
      }, { quoted: msg })
    }

    exec(command, async (err, stdout, stderr) => {
      const output = stdout || stderr || 'No output.'
      await sock.sendMessage(remoteJid, {
        text: `*• ────────────────── •*\n💻 Terminal Output\n*• ────────────────── •*\n\`\`\`${output.slice(0, 3000)}\`\`\`\n*• ────────────────── •*`,
      }, { quoted: msg })
    })
  }
}
