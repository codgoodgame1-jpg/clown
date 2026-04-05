const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const os = require('os')

ffmpeg.setFfmpegPath(ffmpegPath)

const SUPPORTED_FORMATS = ['mp3', 'mp4', 'mkv', 'wav', 'gif', 'webp', 'ogg', 'flac', 'avi', 'mov']
const MIME_MAP = {
  mp3: 'audio/mpeg', mp4: 'video/mp4', mkv: 'video/x-matroska',
  wav: 'audio/wav', gif: 'image/gif', webp: 'image/webp',
  ogg: 'audio/ogg', flac: 'audio/flac', avi: 'video/x-msvideo', mov: 'video/quicktime',
}

const getMediaFromMsg = (msg) => {
  const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage']

  // Cek quoted
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted) {
    const type = mediaTypes.find(t => quoted[t])
    if (type) return { type, isQuoted: true }
  }

  // Cek direct
  const direct = msg.message
  if (direct) {
    const type = mediaTypes.find(t => direct[t])
    if (type) return { type, isQuoted: false }
  }

  return null
}

module.exports = {
  name: 'convert',
  usage: 'convert',
  description: 'Convert file ke format lain',
  isOwner: false,
  isActive: true,

  run: async (sock, msg, args, { remoteJid }) => {
    const targetFormat = args[0]?.toLowerCase()

    if (!targetFormat || !SUPPORTED_FORMATS.includes(targetFormat)) {
      return msg.reply(`⚠️ Format tidak valid!\nYang didukung: ${SUPPORTED_FORMATS.join(', ')}\nContoh: Reply file + *;convert mp3*`)
    }

    const media = getMediaFromMsg(msg)
    if (!media) {
      return msg.reply('⚠️ Reply dulu ke file yang mau diconvert!')
    }

    await msg.reply(`⏳ Mengconvert ke *${targetFormat}*...`)

    try {
      let buffer
      if (media.isQuoted) {
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

      const ext = media.type.replace('Message', '')
      const inputPath = path.join(os.tmpdir(), `input_${Date.now()}.${ext}`)
      const outputPath = path.join(os.tmpdir(), `output_${Date.now()}.${targetFormat}`)
      fs.writeFileSync(inputPath, buffer)

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath).toFormat(targetFormat).save(outputPath)
          .on('end', resolve).on('error', reject)
      })

      const outputBuffer = fs.readFileSync(outputPath)
      const mimeType = MIME_MAP[targetFormat] || 'application/octet-stream'
      const isAudio = ['mp3', 'wav', 'ogg', 'flac'].includes(targetFormat)
      const isVideo = ['mp4', 'mkv', 'avi', 'mov'].includes(targetFormat)
      const isImage = ['webp', 'gif'].includes(targetFormat)

      if (isAudio) {
        await sock.sendMessage(remoteJid, { audio: outputBuffer, mimetype: mimeType, ptt: false }, { quoted: msg })
      } else if (isVideo) {
        await sock.sendMessage(remoteJid, { video: outputBuffer, mimetype: mimeType }, { quoted: msg })
      } else if (isImage) {
        await sock.sendMessage(remoteJid, { image: outputBuffer, mimetype: mimeType }, { quoted: msg })
      } else {
        await sock.sendMessage(remoteJid, { document: outputBuffer, mimetype: mimeType, fileName: `output.${targetFormat}` }, { quoted: msg })
      }

      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

    } catch (err) {
      await msg.reply(`❌ Gagal convert: ${err.message}`)
    }
  }
}
