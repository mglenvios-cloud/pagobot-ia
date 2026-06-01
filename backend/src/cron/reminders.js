import cron from 'node-cron'

export function initCron(waSocket) {
  if (!waSocket) return

  const adminNumber = process.env.VITE_WHATSAPP_NUMBER
  if (!adminNumber) {
    console.log('⚠️ VITE_WHATSAPP_NUMBER no configurado, recordatorios desactivados')
    return
  }

  const adminJid = `${adminNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`

  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Enviando recordatorio diario...')
    const { enviarPagosPendientes } = await import('../whatsapp/bot.js')
    try {
      await enviarPagosPendientes(waSocket, adminJid)
      console.log('✅ Recordatorio enviado')
    } catch (e) {
      console.log('❌ Error en recordatorio:', e.message)
    }
  })

  cron.schedule('0 18 * * 6', () => {
    console.log('📊 Enviando resumen semanal...')
  })

  console.log('⏰ Recordatorios automáticos activados (9 AM diario)')
}
