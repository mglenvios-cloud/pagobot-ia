import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createClient } from '@supabase/supabase-js'
import { initWhatsApp } from './whatsapp/bot.js'
import { initCron } from './cron/reminders.js'
import paymentRoutes from './routes/payments.js'
import analysisRoutes from './routes/analysis.js'
import whatsappRoutes from './routes/whatsapp.js'

const app = express()
const PORT = process.env.PORT || 3000

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use('/api/pagos', paymentRoutes)
app.use('/api/analisis', analysisRoutes)
app.use('/api/whatsapp', whatsappRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', name: 'PagoBot IA' })
})

async function start() {
  try {
    const { waSocket } = await initWhatsApp()
    app.locals.waSocket = waSocket
    initCron(waSocket)
    console.log('🤖 PagoBot IA Backend listo')
  } catch (e) {
    console.log('⚠️ WhatsApp no conectado (opcional):', e.message)
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`)
  })
}

start()
