import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'

export async function initWhatsApp() {
  let sock = null
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          console.log('🔄 Reconectando WhatsApp...')
          initWhatsApp()
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado!')
      }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key.fromMe && msg.message?.conversation) {
          const text = msg.message.conversation.toLowerCase()
          const jid = msg.key.remoteJid

          if (['hola', '!pagos', 'pagos'].includes(text)) {
            await enviarPagosPendientes(sock, jid)
          } else if (text === '!ayuda') {
            await sock.sendMessage(jid, {
              text: `🤖 *PagoBot IA - Comandos*\n\n• *hola* - Ver próximos pagos\n• *!resumen* - Resumen del mes\n• *!ayuda* - Mostrar ayuda`,
            })
          } else if (text === '!resumen') {
            await enviarResumen(sock, jid)
          }
        }
      }
    })
  } catch (e) {
    console.log('⚠️ Error iniciando WhatsApp:', e.message)
  }

  return { waSocket: sock }
}

export async function enviarPagosPendientes(sock, jid) {
  try {
    const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/pagos?select=*&pagado=eq.false&order=fecha_vencimiento.asc&limit=10`, {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}` },
    })
    const pagos = await res.json()

    if (!pagos || pagos.length === 0) {
      return sock.sendMessage(jid, { text: '🎉 No tenés pagos pendientes!' })
    }

    let msg = `📋 *Tus próximos pagos:*\n\n`
    pagos.forEach((p, i) => {
      const dias = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 3600 * 24))
      const emoji = dias < 0 ? '🔴' : dias <= 3 ? '🟡' : '🟢'
      msg += `${emoji} ${i + 1}. *${p.concepto}* - $${p.monto}\n   📅 ${p.fecha_vencimiento} (${dias < 0 ? 'VENCIDO' : `faltan ${dias} días`})\n\n`
    })

    await sock.sendMessage(jid, { text: msg })
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Error al obtener pagos' })
  }
}

async function enviarResumen(sock, jid) {
  try {
    const hoy = new Date()
    const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/pagos?select=monto&pagado=eq.true&gte=fecha_vencimiento=${mes}-01&lte=fecha_vencimiento=${mes}-31`, {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}` },
    })
    const pagados = await res.json()
    const total = pagados.reduce((a, p) => a + parseFloat(p.monto), 0)

    await sock.sendMessage(jid, {
      text: `📊 *Resumen del mes*\n\n💰 Gastado: $${total.toFixed(2)}\n📅 ${mes}`,
    })
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Error al obtener resumen' })
  }
}
