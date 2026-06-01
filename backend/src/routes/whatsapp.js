import { Router } from 'express'

const router = Router()

router.post('/enviar-recordatorio', async (req, res) => {
  const { numero, mensaje } = req.body
  if (!numero || !mensaje) return res.status(400).json({ error: 'numero y mensaje requeridos' })

  const waSocket = req.app.locals.waSocket
  if (!waSocket) return res.status(503).json({ error: 'WhatsApp no conectado' })

  try {
    const jid = `${numero.replace(/[^0-9]/g, '')}@s.whatsapp.net`
    await waSocket.sendMessage(jid, { text: mensaje })
    res.json({ ok: true, mensaje: 'Recordatorio enviado' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/enlace/:numero', (req, res) => {
  const numero = req.params.numero.replace(/[^0-9]/g, '')
  const texto = req.query.texto || 'Hola PagoBot IA'
  const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
  res.json({ enlace })
})

router.get('/qr', async (req, res) => {
  const waSocket = req.app.locals.waSocket
  res.json({
    conectado: !!waSocket,
    mensaje: waSocket ? 'WhatsApp conectado' : 'WhatsApp no conectado. Ejecutá el bot manualmente si usás Baileys.',
  })
})

export default router
