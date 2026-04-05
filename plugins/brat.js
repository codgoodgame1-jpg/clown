const { createCanvas } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const os = require('os')
const sharp = require('sharp')

module.exports = {
  name: 'brat',
  usage: 'brat',
  description: 'Bikin stiker teks ala brat',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const text = args.join(' ')
    if (!text) {
      return await sock.sendMessage(remoteJid, {
        text: '⚠️ Masukkan teks!\nContoh: .brat halo dunia',
      }, { quoted: msg })
    }

    try {
      const canvas = createCanvas(512, 512)
      const ctx = canvas.getContext('2d')

      // Background hijau brat
      ctx.fillStyle = '#8aba00'
      ctx.fillRect(0, 0, 512, 512)

      // Teks blur ala brat
      ctx.filter = 'blur(2px)'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 72px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Word wrap
      const words = text.split(' ')
      const lines = []
      let currentLine = ''
      const maxWidth = 440

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)

      const lineHeight = 80
      const startY = 256 - ((lines.length - 1) * lineHeight) / 2

      lines.forEach((line, i) => {
        ctx.fillText(line, 256, startY + i * lineHeight)
      })

      // Convert ke webp
      const buffer = canvas.toBuffer('image/png')
      const outputPath = path.join(os.tmpdir(), `brat_${Date.now()}.webp`)

      await sharp(buffer)
        .resize(512, 512)
        .webp()
        .toFile(outputPath)

      await sock.sendMessage(remoteJid, {
        sticker: fs.readFileSync(outputPath),
      }, { quoted: msg })

      fs.unlinkSync(outputPath)
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Gagal buat brat stiker: ${err.message}`,
      }, { quoted: msg })
    }
  }
}
