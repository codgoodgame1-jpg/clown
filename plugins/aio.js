const axios = require('axios')

module.exports = {
  name: 'aio',
  usage: 'aio',
  description: 'Download video/gambar dari TikTok, Instagram, Facebook',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const url = args[0]
    if (!url) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan link!\nContoh: .aio https://www.tiktok.com/...',
      }, { quoted: msg })
    }

    await sock.sendMessage(remoteJid, { text: '⏳ Sedang memproses link...' }, { quoted: msg })

    try {
      // Pakai cobalt.tools API (free, no key needed)
      const res = await axios.post('https://api.cobalt.tools/api/json', {
        url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        isNoTTWatermark: true,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })

      const data = res.data

      if (data.status === 'error') {
        return await sock.sendMessage(remoteJid, {
          text: `❌ Gagal download: ${data.text}`,
        }, { quoted: msg })
      }

      if (data.status === 'stream' || data.status === 'redirect') {
        const mediaUrl = data.url

        // Cek apakah video atau gambar
        const isVideo = mediaUrl.includes('.mp4') || data.status === 'stream'

        if (isVideo) {
          await sock.sendMessage(remoteJid, {
            video: { url: mediaUrl },
            caption: '✅ Download selesai!',
          }, { quoted: msg })
        } else {
          await sock.sendMessage(remoteJid, {
            image: { url: mediaUrl },
            caption: '✅ Download selesai!',
          }, { quoted: msg })
        }
      } else if (data.status === 'picker') {
        // Multiple images (misal IG carousel)
        await sock.sendMessage(remoteJid, { text: `📦 Ditemukan ${data.picker.length} media, mengirim satu per satu...` }, { quoted: msg })
        for (const item of data.picker) {
          await sock.sendMessage(remoteJid, {
            image: { url: item.url },
          })
        }
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Error: ${err.message}`,
      }, { quoted: msg })
    }
  }
}
