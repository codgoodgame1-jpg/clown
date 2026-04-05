const YTDlpWrap = require('yt-dlp-wrap').default
const fs = require('fs')
const os = require('os')
const path = require('path')

module.exports = {
  name: 'play',
  usage: 'play',
  description: 'Putar lagu dari YouTube',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const query = args.join(' ')
    if (!query) return msg.reply('⚠️ Masukkan judul lagu!\nContoh: ;play never gonna give you up')

    await msg.reply(`🔍 Mencari: *${query}*...`)

    try {
      // Auto-download yt-dlp binary kalau belum ada
      const ytDlpWrap = new YTDlpWrap()
      const binaryPath = path.join(os.tmpdir(), 'yt-dlp')
      if (!fs.existsSync(binaryPath)) {
        await msg.reply('⏳ Download yt-dlp binary dulu...')
        await YTDlpWrap.downloadFromGithub(binaryPath)
      }
      ytDlpWrap.setBinaryPath(binaryPath)

      const searchResults = await ytDlpWrap.execPromise([
        `ytsearch1:${query}`,
        '--dump-json',
        '--no-playlist',
      ])

      const info = JSON.parse(searchResults)

      if (info.duration > 600) {
        return msg.reply('⚠️ Durasi lagu terlalu panjang! Maksimal 10 menit.')
      }

      await msg.reply(`🎵 Ditemukan: *${info.title}*\n⏳ Sedang mengunduh...`)

      const outputPath = path.join(os.tmpdir(), `play_${Date.now()}.mp3`)

      await ytDlpWrap.execPromise([
        info.webpage_url,
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputPath,
        '--no-playlist',
      ])

      await sock.sendMessage(remoteJid, {
        audio: { url: outputPath },
        mimetype: 'audio/mp4',
        ptt: false,
      }, { quoted: msg })

      fs.unlinkSync(outputPath)
    } catch (err) {
      await msg.reply(`❌ Gagal download: ${err.message}`)
    }
  }
}
