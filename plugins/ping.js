module.exports = {
  name: 'ping',
  usage: 'ping',
  description: 'Cek response time bot',
  isOwner: false,
  isActive: true,

  run: async (sock, msg) => {
    const start = Date.now()

    // Kirim pesan awal buat ngukur latency
    await sock.sendMessage(msg.key.remoteJid, { text: 'mengukur...' })

    const latency = Date.now() - start

    // RAM usage
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)

    // Uptime
    const totalSeconds = Math.floor(process.uptime())
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const uptime = `${hours}h ${minutes}m ${seconds}s`

    const text = `*• ────────────────── •*
      🏓 PONG!
*• ────────────────── •*
  latency  ›  ${latency}ms
  status   ›  online ✅
  ram      ›  ${ramUsage} MB
  uptime   ›  ${uptime}
*• ────────────────── •*`

    await sock.sendMessage(msg.key.remoteJid, { text })
  }
}
