const axios = require('axios')

module.exports = {
  name: 'ai',
  usage: 'ai',
  description: 'Tanya AI lewat Gemini',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid, config }) => {
    const prompt = args.join(' ')
    if (!prompt) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan pertanyaan!\nContoh: .ai siapa itu einstein?',
      }, { quoted: msg })
    }

    await sock.sendMessage(remoteJid, { text: '🤖 Sedang memproses...' }, { quoted: msg })

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiApiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      )

      const answer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada jawaban.'

      await sock.sendMessage(remoteJid, {
        text: `*• ────────────────── •*\n🤖 *AI Response*\n*• ────────────────── •*\n${answer}\n*• ────────────────── •*`,
      }, { quoted: msg })
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Gagal menghubungi Gemini API.\n${err.message}`,
      }, { quoted: msg })
    }
  }
}
