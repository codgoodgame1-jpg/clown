const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../database/settings.json')

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

// Simpan interval aktif per grup
const activeSchedules = {}

const startScheduler = (sock, groupId, openHour, closeHour) => {
  // Clear jadwal lama kalau ada
  if (activeSchedules[groupId]) {
    clearInterval(activeSchedules[groupId])
  }

  activeSchedules[groupId] = setInterval(async () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    if (hour === openHour && minute === 0) {
      await sock.groupSettingUpdate(groupId, 'not_announcement')
      await sock.sendMessage(groupId, { text: '🔓 Grup dibuka otomatis sesuai jadwal!' })
    }

    if (hour === closeHour && minute === 0) {
      await sock.groupSettingUpdate(groupId, 'announcement')
      await sock.sendMessage(groupId, { text: '🔒 Grup ditutup otomatis sesuai jadwal!' })
    }
  }, 60 * 1000) // cek setiap menit
}

module.exports = {
  name: 'jdwgc',
  usage: 'jdwgc',
  description: 'Atur jadwal buka & tutup grup otomatis',
  isOwner: true,
  isActive: true,

  // Expose startScheduler buat dipanggil dari index.js saat bot start
  startScheduler,

  run: async (sock, msg, args, { remoteJid, isGroup }) => {
    if (!isGroup) {
      return await sock.sendMessage(remoteJid, {
        text: '⛔ Command ini hanya bisa digunakan di grup!',
      }, { quoted: msg })
    }

    // Format: .jdwgc set 08 22
    // Format: .jdwgc off
    const sub = args[0]

    if (sub === 'off') {
      if (activeSchedules[remoteJid]) {
        clearInterval(activeSchedules[remoteJid])
        delete activeSchedules[remoteJid]
      }

      // Hapus dari DB
      const db = readDB()
      if (db.schedules) delete db.schedules[remoteJid]
      writeDB(db)

      return await sock.sendMessage(remoteJid, {
        text: '✅ Jadwal grup dimatikan!',
      }, { quoted: msg })
    }

    if (sub === 'set') {
      const openHour = parseInt(args[1])
      const closeHour = parseInt(args[2])

      if (isNaN(openHour) || isNaN(closeHour)) {
        return await sock.sendMessage(remoteJid, {
          text: '⚠️ Format salah!\nContoh: .jdwgc set 08 22\n(buka jam 08.00, tutup jam 22.00)',
        }, { quoted: msg })
      }

      // Simpan ke DB
      const db = readDB()
      if (!db.schedules) db.schedules = {}
      db.schedules[remoteJid] = { openHour, closeHour }
      writeDB(db)

      startScheduler(sock, remoteJid, openHour, closeHour)

      return await sock.sendMessage(remoteJid, {
        text: `*• ────────────────── •*\n⏰ Jadwal grup diatur!\n*• ────────────────── •*\n  buka   ›  ${String(openHour).padStart(2, '0')}.00\n  tutup  ›  ${String(closeHour).padStart(2, '0')}.00\n*• ────────────────── •*`,
      }, { quoted: msg })
    }

    await sock.sendMessage(remoteJid, {
      text: '⚠️ Subcommand tidak dikenal!\n.jdwgc set [jam buka] [jam tutup]\n.jdwgc off',
    }, { quoted: msg })
  }
}
