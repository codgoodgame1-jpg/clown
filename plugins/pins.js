const axios = require('axios')

module.exports = {
  name: 'pins',
  usage: 'pins',
  description: 'Cari foto dari Pinterest',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const query = args.join(' ')
    if (!query) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan kata kunci!\nContoh: .pins aesthetic room',
      }, { quoted: msg })
    }

    await sock.sendMessage(remoteJid, { text: `🔍 Mencari *${query}* di Pinterest...` }, { quoted: msg })

    try {
      const res = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/`, {
        params: {
          source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
          data: JSON.stringify({
            options: {
              query,
              scope: 'pins',
              page_size: 5,
            },
            context: {},
          }),
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      const results = res.data?.resource_response?.data?.results
      if (!results || results.length === 0) {
        return await sock.sendMessage(remoteJid, {
          text: '❌ Tidak ditemukan hasil untuk kata kunci tersebut.',
        }, { quoted: msg })
      }

      await sock.sendMessage(remoteJid, {
        text: `✅ Ditemukan hasil untuk *${query}*, mengirim ${Math.min(results.length, 5)} gambar...`,
      }, { quoted: msg })

      let sent = 0
      for (const pin of results) {
        const imageUrl =
          pin?.images?.orig?.url ||
          pin?.images?.['736x']?.url ||
          pin?.image?.original?.url

        if (!imageUrl) continue

        await sock.sendMessage(remoteJid, {
          image: { url: imageUrl },
          caption: pin.title || '',
        })

        sent++
        if (sent >= 5) break
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Gagal mencari di Pinterest: ${err.message}`,
      }, { quoted: msg })
    }
  }
}
