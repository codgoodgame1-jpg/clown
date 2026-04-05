const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const os = require('os')

const getMediaFromMsg = (msg) => {
  // Cek pesan langsung (kirim gambar + caption .s)
  const direct = msg.message
  if (direct?.imageMessage) return { type: 'imageMessage', source: direct }
  if (direct?.videoMessage) return { type: 'videoMessage', source: direct }

  // Cek quoted message (reply ke gambar)
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage) return { type: 'imageMessage', source: quoted }
  if (quoted?.videoMessage) return { type: 'videoMessage', source: quoted }

  return null
}

module.exports = {
  name: 'sticker',
  usage: 's',
  description: 'Bikin stiker dari gambar/video',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const media = getMediaFromMsg(msg)

    if (!media) {
      return msg.reply('⚠️ Reply atau kirim gambar/video dengan caption *;s*')
    }

    await msg.reply('⏳ Membuat stiker...')

    try {
      const isQuoted = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[media.type]

      let buffer
      if (isQuoted) {
        const quotedMsg = {
          message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
          key: {
            ...msg.key,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant,
          }
        }
        buffer = await downloadMediaMessage(quotedMsg, 'buffer', {})
      } else {
        buffer = await downloadMediaMessage(msg, 'buffer', {})
      }

      const outputPath = path.join(os.tmpdir(), `sticker_${Date.now()}.webp`)

      if (media.type === 'imageMessage') {
        await sharp(buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp()
          .toFile(outputPath)

        await sock.sendMessage(remoteJid, {
          sticker: fs.readFileSync(outputPath),
        }, { quoted: msg })

        fs.unlinkSync(outputPath)

      } else if (media.type === 'videoMessage') {
        const ffmpeg = require('fluent-ffmpeg')
        const ffmpegPath = require('ffmpeg-static')
        ffmpeg.setFfmpegPath(ffmpegPath)

        const inputPath = path.join(os.tmpdir(), `input_${Date.now()}.mp4`)
        fs.writeFileSync(inputPath, buffer)

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .outputOptions([
              '-vcodec', 'libwebp',
              '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse',
              '-loop', '0',
              '-ss', '00:00:00',
              '-t', '00:00:05',
              '-preset', 'default',
              '-an',
              '-vsync', '0',
            ])
            .toFormat('webp')
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject)
        })

        await sock.sendMessage(remoteJid, {
          sticker: fs.readFileSync(outputPath),
        }, { quoted: msg })

        fs.unlinkSync(inputPath)
        fs.unlinkSync(outputPath)
      }

    } catch (err) {
      await msg.reply(`❌ Gagal buat stiker: ${err.message}`)
    }
  }
}
