import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import { HiLightBulb, HiExclamation, HiTrendingUp, HiBan, HiSparkles, HiRefresh, HiChat } from 'react-icons/hi'

const CATEGORIAS_GASTO = {
  delivery: { keywords: ['delivery', 'pedidos', 'rapp', 'uber eats', 'didi food', 'comida', 'pizz', 'hamburg'], icono: '🍕', titulo: 'Delivery' },
  suscripciones: { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'paramount', 'crunchyroll', 'apple music', 'youtube', 'google one', 'icloud'], icono: '🔄', titulo: 'Suscripciones' },
  salidas: { keywords: ['bar', 'restaurante', 'cine', 'salida', 'boletería', 'teatro', 'cerveza'], icono: '🎉', titulo: 'Salidas' },
  supermercado: { keywords: ['supermercado', 'super', 'chino', 'almacén', 'coto', 'disco', 'carrefour', 'dia'], icono: '🛒', titulo: 'Supermercado' },
  transporte: { keywords: ['uber', 'taxi', 'cabify', 'did', 'colectivo', 'subte', 'nafta', 'bondi'], icono: '🚗', titulo: 'Transporte' },
  servicios: { keywords: ['luz', 'agua', 'gas', 'internet', 'telefono', 'expensas', 'abc', 'edenor', 'metrogas', 'aysa', 'personal', 'movistar', 'claro', 'telecentro', 'fibertel'], icono: '💡', titulo: 'Servicios' },
}

const COLORS = ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0891b2']

const CHAT_SUGERENCIAS = [
  "¿Cómo puedo ahorrar más este mes?",
  "¿Qué gasto puedo reducir?",
  "Analizá mis suscripciones",
  "¿Cuánto gasté en delivery?",
  "Dame un resumen financiero",
]

export default function AIAnalysis() {
  const [data, setData] = useState(null)
  const [susData, setSusData] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatResp, setChatResp] = useState('')

  const analyze = async () => {
    setLoading(true)
    const hoy = new Date()
    const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const { data: pagos } = await supabase.from('pagos').select('*').gte('fecha_vencimiento', `${mes}-01`).lte('fecha_vencimiento', `${mes}-31`)
    const { data: ingresos } = await supabase.from('ingresos').select('*').gte('fecha', `${mes}-01`).lte('fecha', `${mes}-31`)
    const { data: historial } = await supabase.from('pagos').select('*').order('fecha_vencimiento')

    const pagosList = pagos || []
    const ingresosList = ingresos || []
    const total = pagosList.reduce((a, p) => a + parseFloat(p.monto), 0)
    const totalIngresos = ingresosList.reduce((a, i) => a + parseFloat(i.monto), 0)
    const recomendaciones = []
    const categoriasData = []

    for (const [tipo, config] of Object.entries(CATEGORIAS_GASTO)) {
      const coincidencias = pagosList.filter((p) => config.keywords.some((kw) => p.concepto.toLowerCase().includes(kw)))
      if (coincidencias.length > 0) {
        const totalCat = coincidencias.reduce((a, p) => a + parseFloat(p.monto), 0)
        const ahorro = totalCat * 0.25
        recomendaciones.push({
          tipo, titulo: config.titulo, icono: config.icono,
          mensaje: tipo === 'suscripciones'
            ? `Gastaste $${fmt(totalCat)} en suscripciones (${coincidencias.length} servicios). ${coincidencias.length > 2 ? `Cancelar 1 te ahorraría ~$${fmt(ahorro)}/mes.` : 'Considerá planes compartidos.'}`
            : `Gastaste $${fmt(totalCat)} en ${config.titulo.toLowerCase()}. ${tipo === 'delivery' ? 'Cocinar en casa 2 veces por semana te ahorraría ~$' + fmt(ahorro) + '.' : 'Podrías reducir ~$' + fmt(ahorro) + ' este mes.'}`,
          monto: totalCat, cantidad: coincidencias.length, ahorro,
        })
        categoriasData.push({ name: config.titulo, value: totalCat, color: COLORS[Object.keys(CATEGORIAS_GASTO).indexOf(tipo) % COLORS.length] })
      }
    }

    const maxGasto = pagosList.reduce((max, p) => (parseFloat(p.monto) > parseFloat(max.monto) ? p : max), pagosList[0])
    if (maxGasto && total > 0 && parseFloat(maxGasto.monto) > total * 0.3) {
      recomendaciones.push({
        tipo: 'gasto_alto', titulo: '⚠️ Gasto Alto', icono: '⚠️',
        mensaje: `${maxGasto.concepto} ($${fmt(maxGasto.monto)}) es el ${(parseFloat(maxGasto.monto) / total * 100).toFixed(0)}% de tus gastos. Buscá alternativas.`,
        monto: parseFloat(maxGasto.monto), ahorro: parseFloat(maxGasto.monto) * 0.15,
      })
    }

    if (historial && historial.length > 0) {
      const meses = [...new Set(historial.map((p) => p.fecha_vencimiento.slice(0, 7)))].sort().slice(-2)
      if (meses.length === 2) {
        const act = historial.filter((p) => p.fecha_vencimiento.startsWith(meses[1]))
        const ant = historial.filter((p) => p.fecha_vencimiento.startsWith(meses[0]))
        const totalAct = act.reduce((a, p) => a + parseFloat(p.monto), 0)
        const totalAnt = ant.reduce((a, p) => a + parseFloat(p.monto), 0)
        if (totalAnt > 0 && totalAct > totalAnt) {
          const pct = ((totalAct - totalAnt) / totalAnt * 100).toFixed(0)
          recomendaciones.push({
            tipo: 'incremento', titulo: '📈 Incremento', icono: '📈',
            mensaje: `Tus gastos aumentaron un ${pct}% respecto al mes anterior ($${fmt(totalAnt)} → $${fmt(totalAct)}). Revisá tus hábitos.`,
            ahorro: totalAct - totalAnt,
          })
        }
      }
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push({ tipo: 'ok', titulo: '✅ Todo en orden', icono: '✅', mensaje: 'Tus gastos están balanceados. ¡Seguí así!', ahorro: 0 })
    }

    const ahorroTotal = recomendaciones.reduce((a, r) => a + parseFloat(r.ahorro), 0)

    const gastosPorDia = {}
    pagosList.forEach((p) => {
      const dia = parseInt(p.fecha_vencimiento.split('-')[2])
      gastosPorDia[dia] = (gastosPorDia[dia] || 0) + parseFloat(p.monto)
    })
    const maxDia = Math.max(...Object.values(gastosPorDia), 1)
    const chartData = Array.from({ length: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() }, (_, i) => ({
      dia: i + 1,
      gastos: gastosPorDia[i + 1] || 0,
      pct: ((gastosPorDia[i + 1] || 0) / maxDia) * 100,
    }))

    setData({ total_gastado: total, total_ingresos: totalIngresos, recomendaciones, ahorro_total: ahorroTotal, cantidad_pagos: pagosList.length, chartData, categoriasData })
    setSusData(pagosList.filter((p) => p.es_recurrente && !p.pagado))
    setLoading(false)
  }

  useEffect(() => { analyze() }, [])

  const chatResponder = (msg) => {
    const lower = msg.toLowerCase()
    if (lower.includes('ahorrar')) return '📊 Registrá todos tus gastos y revisá suscripciones. Apuntá a ahorrar al menos el 20% de tus ingresos.'
    if (lower.includes('suscripcion') || lower.includes('netflix') || lower.includes('disney')) return '🔄 Revisá tus suscripciones activas en la sección Pagos. Cancelá las que no uses.'
    if (lower.includes('delivery') || lower.includes('comida')) return '🍕 Cocinando 2 veces más por semana podrías ahorrar ~$15,000/mes.'
    if (lower.includes('resumen')) return `💰 Gastaste $${fmt(data?.total_gastado || 0)} este mes. Ingresos: $${fmt(data?.total_ingresos || 0)}. Balance: $${fmt((data?.total_ingresos || 0) - (data?.total_gastado || 0))}.`
    return '🤖 Soy PagoBot IA. Preguntame sobre tus gastos, ahorro, suscripciones o pedime un resumen.'
  }

  const handleChat = (e) => {
    e?.preventDefault()
    if (!chatMsg.trim()) return
    setChatResp(chatResponder(chatMsg))
    setChatMsg('')
  }

  const total = data?.total_gastado || 0
  const ingresos = data?.total_ingresos || 0
  const balance = ingresos - total
  const chartData = data?.chartData || []
  const categoriasData = data?.categoriasData || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análisis IA</h1>
        <button onClick={analyze} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all">
          <HiRefresh className="text-lg" /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Analizando gastos...</div>
      ) : data ? (
        <>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <HiSparkles className="text-2xl text-yellow-300" />
              <h2 className="text-lg font-semibold">Resumen Inteligente</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-sm">Gastado</p>
                <p className="text-3xl font-bold">${fmt(total)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Ahorro potencial</p>
                <p className="text-3xl font-bold text-green-300">~${fmt(data.ahorro_total)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Ingresos</p>
                <p className="text-xl font-semibold text-green-300">+${fmt(ingresos)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Balance</p>
                <p className={`text-xl font-semibold ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>${fmt(balance)}</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-3">{data.cantidad_pagos} pagos registrados</p>
          </div>

          {/* Bar chart - CSS based */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><HiTrendingUp /> Gastos por día</h3>
              <div className="flex items-end gap-0.5 h-32">
                {chartData.map((d) => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-300 relative group" style={{ height: `${d.pct}%` }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">${fmt(d.gastos)}</div>
                    </div>
                    {chartData.length <= 31 && <span className="text-[8px] text-gray-400">{d.dia}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pie chart - CSS based */}
          {categoriasData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Distribución por categoría</h3>
              <div className="space-y-2">
                {categoriasData.map((c, i) => {
                  const pct = (c.value / total) * 100
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span>{c.name}</span>
                        <span className="font-medium">${fmt(c.value)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><HiLightBulb className="text-yellow-500" /> Recomendaciones</h3>
            {data.recomendaciones.map((r, i) => (
              <div key={i} className={`card flex items-start gap-3 ${r.tipo === 'ok' ? 'bg-green-50 dark:bg-green-900/10' : r.tipo === 'gasto_alto' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <span className="text-xl mt-0.5">{r.icono}</span>
                <div>
                  <p className="font-medium text-sm">{r.titulo}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{r.mensaje}</p>
                  {r.ahorro > 0 && <p className="text-xs text-green-600 font-medium mt-1">Potencial ahorro: ~${fmt(r.ahorro)}</p>}
                </div>
              </div>
            ))}
          </div>

          {susData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><HiBan className="text-red-500" /> Suscripciones activas</h3>
              <div className="space-y-2">
                {susData.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <span className="font-medium">{s.concepto}</span>
                      <span className="text-sm text-gray-500 ml-2">{s.categoria}</span>
                    </div>
                    <span className="font-bold">${fmt(s.monto)}/mes</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">Total: <strong className="text-gray-800 dark:text-gray-200">${fmt(susData.reduce((a, s) => a + parseFloat(s.monto), 0))}/mes</strong></p>
            </div>
          )}

          {/* Chat IA */}
          <div className={`fixed bottom-24 right-4 z-50 transition-all duration-300 ${chatOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-80 border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="bg-blue-600 p-3 flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2">🤖 PagoBot Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <div className="p-3 h-48 overflow-y-auto text-sm">
                {chatResp && <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-2"><p>{chatResp}</p></div>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CHAT_SUGERENCIAS.map((s) => (
                    <button key={s} onClick={() => { setChatResp(chatResponder(s)) }} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">{s}</button>
                  ))}
                </div>
              </div>
              <form onSubmit={handleChat} className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Preguntá algo..." className="input flex-1 text-sm" />
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-all">Enviar</button>
              </form>
            </div>
          </div>

          <button onClick={() => setChatOpen(!chatOpen)} className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95">
            <HiChat className="text-2xl" />
          </button>
        </>
      ) : null}
    </div>
  )
}
