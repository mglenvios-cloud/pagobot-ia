import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import cron from 'node-cron'
import { config } from 'dotenv'

config({ path: '../.env' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_NUMBER = process.env.VITE_WHATSAPP_NUMBER

let sock

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ PagoBot WhatsApp conectado!')
    }
  })

  // Escuchar comandos
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message?.conversation) {
        const text = msg.message.conversation.toLowerCase()
        const jid = msg.key.remoteJid

        if (text === 'hola' || text === '!pagos') {
          await sendPagos(jid)
        } else if (text === '!ayuda') {
          await sock.sendMessage(jid, {
            text: `🤖 *PagoBot IA - Comandos*\n\n• *hola* o *!pagos* - Ver próximos pagos\n• *!ayuda* - Mostrar esta ayuda`,
          })
        }
      }
    }
  })
}

async function sendPagos(jid) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pagos?select=*&pagado=eq.false&order=fecha_vencimiento.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    const pagos = await res.json()

    if (!pagos || pagos.length === 0) {
      return sock.sendMessage(jid, { text: '🎉 No tenés pagos pendientes!' })
    }

    let msg = '📋 *Tus próximos pagos:*\n\n'
    pagos.forEach((p, i) => {
      msg += `${i + 1}. *${p.concepto}* - $${p.monto}\n`
      msg += `   📅 Vence: ${p.fecha_vencimiento}\n\n`
    })

    await sock.sendMessage(jid, { text: msg })
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Error al obtener pagos' })
  }
}

// Recordatorios automáticos cada día a las 9 AM
cron.schedule('0 9 * * *', async () => {
  if (!ADMIN_NUMBER) return
  const jid = `${ADMIN_NUMBER}@s.whatsapp.net`
  await sendPagos(jid)
})

startBot()
