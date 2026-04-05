const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')
const os = require('os')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  name: 'bratvid',
  usage: 'bratvid',
  description: 'Bikin stiker teks animated ala brat (kata muncul 1-1)',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const text = args.join(' ')
    if (!text) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan teks!\nContoh: .bratvid halo dunia',
      }, { quoted: msg })
    }

    await sock.sendMessage(remoteJid, { text: '⏳ Membuat animated stiker...' }, { quoted: msg })

    try {
      const words = text.split(' ')
      const frameDir = path.join(os.tmpdir(), `bratframes_${Date.now()}`)
      fs.mkdirSync(frameDir)

      // Generate frame per kata
      for (let i = 0; i < words.length; i++) {
        const displayText = words.slice(0, i + 1).join(' ')
        const canvas = createCanvas(512, 512)
        const ctx = canvas.getContext('2d')

        // Background
        ctx.fillStyle = '#8aba00'
        ctx.fillRect(0, 0, 512, 512)

        // Teks blur
        ctx.filter = 'blur(2px)'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 72px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Word wrap
        const wordList = displayText.split(' ')
        const lines = []
        let currentLine = ''
        const maxWidth = 440

        for (const word of wordList) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        lines.push(currentLine)

        const lineHeight = 80
        const startY = 256 - ((lines.length - 1) * lineHeight) / 2
        lines.forEach((line, j) => {
          ctx.fillText(line, 256, startY + j * lineHeight)
        })

        const framePath = path.join(frameDir, `frame${String(i).padStart(4, '0')}.png`)
        fs.writeFileSync(framePath, canvas.toBuffer('image/png'))
      }

      const outputPath = path.join(os.tmpdir(), `bratvid_${Date.now()}.webp`)

      // Convert frames ke animated webp
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(path.join(frameDir, 'frame%04d.png'))
          .inputOptions(['-framerate', '2'])
          .outputOptions([
            '-vcodec', 'libwebp',
            '-loop', '0',
            '-preset', 'default',
            '-an',
            '-vsync', '0',
            '-vf', 'scale=512:512',
          ])
          .toFormat('webp')
          .save(outputPath)
          .on('end', resolve)
          .on('error', reject)
      })

      await sock.sendMessage(remoteJid, {
        sticker: fs.readFileSync(outputPath),
      }, { quoted: msg })

      // Cleanup
      fs.rmSync(frameDir, { recursive: true })
      fs.unlinkSync(outputPath)

    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Gagal buat bratvid stiker: ${err.message}`,
      }, { quoted: msg })
    }
  }
}
