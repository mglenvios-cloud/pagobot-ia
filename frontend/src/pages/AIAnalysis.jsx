import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiLightBulb, HiExclamation, HiTrendingUp, HiBan, HiSparkles, HiRefresh } from 'react-icons/hi'

const CATEGORIAS_GASTO = {
  delivery: { keywords: ['delivery', 'pedidos', 'rapp', 'uber eats', 'didi food', 'comida'], icono: '🍕', titulo: 'Delivery' },
  suscripciones: { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'paramount', 'crunchyroll', 'apple music', 'youtube premium', 'google one', 'icloud'], icono: '🔄', titulo: 'Suscripciones' },
  salidas: { keywords: ['bar', 'restaurante', 'cine', 'salida', 'boletería', 'teatro'], icono: '🎉', titulo: 'Salidas' },
  supermercado: { keywords: ['supermercado', 'super', 'chino', 'almacén', 'coto', 'disco', 'carrefour', 'dia'], icono: '🛒', titulo: 'Supermercado' },
  transporte: { keywords: ['uber', 'taxi', 'cabify', 'did', 'colectivo', 'subte', 'nafta'], icono: '🚗', titulo: 'Transporte' },
}

export default function AIAnalysis() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [susData, setSusData] = useState(null)

  const analyze = async () => {
    setLoading(true)
    const hoy = new Date()
    const mes = hoy.toISOString().slice(0, 7)

    const { data: pagos } = await supabase
      .from('pagos')
      .select('*')
      .gte('fecha_vencimiento', `${mes}-01`)
      .lte('fecha_vencimiento', `${mes}-31`)

    if (!pagos) { setLoading(false); return }

    const total = pagos.reduce((a, p) => a + (p.pagado ? parseFloat(p.monto) : 0), 0)
    const recomendaciones = []

    for (const [tipo, config] of Object.entries(CATEGORIAS_GASTO)) {
      const coincidencias = pagos.filter((p) => config.keywords.some((kw) => p.concepto.toLowerCase().includes(kw)))
      if (coincidencias.length > 0) {
        const totalCat = coincidencias.reduce((a, p) => a + parseFloat(p.monto), 0)
        const ahorro = (totalCat * 0.25).toFixed(2)
        recomendaciones.push({
          tipo, titulo: config.titulo, icono: config.icono,
          mensaje: tipo === 'suscripciones'
            ? `Gastaste $${totalCat.toFixed(2)} en suscripciones (${coincidencias.length} servicios). ${coincidencias.length > 2 ? `¿Realmente usás todas? Cancelar 1 te ahorraría ~$${ahorro}/mes.` : 'Considerá planes compartidos.'}`
            : `Gastaste $${totalCat.toFixed(2)} en ${config.titulo.toLowerCase()}. ${tipo === 'delivery' ? 'Cocinar en casa 2 veces por semana te ahorraría ~$' + ahorro + '.' : 'Podrías reducir ~$' + ahorro + ' este mes.'}`,
          monto: totalCat, cantidad: coincidencias.length, ahorro,
        })
      }
    }

    const maxGasto = pagos.reduce((max, p) => (parseFloat(p.monto) > parseFloat(max.monto) ? p : max), pagos[0])
    if (maxGasto && total > 0 && parseFloat(maxGasto.monto) > total * 0.3) {
      recomendaciones.push({
        tipo: 'gasto_alto', titulo: '⚠️ Gasto Alto', icono: '⚠️',
        mensaje: `${maxGasto.concepto} ($${parseFloat(maxGasto.monto).toFixed(2)}) es el ${(parseFloat(maxGasto.monto) / total * 100).toFixed(0)}% de tus gastos. ¿Buscaste alternativas más económicas?`,
        monto: parseFloat(maxGasto.monto), ahorro: (parseFloat(maxGasto.monto) * 0.15).toFixed(2),
      })
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push({ tipo: 'ok', titulo: '✅ Todo en orden', icono: '✅', mensaje: 'Tus gastos están balanceados este mes. ¡Seguí así!', ahorro: '0' })
    }

    const ahorroTotal = recomendaciones.reduce((a, r) => a + parseFloat(r.ahorro), 0)
    setData({ total_gastado: total, recomendaciones, ahorro_total: ahorroTotal, cantidad_pagos: pagos.length })

    // Análisis de suscripciones
    const suscripciones = pagos.filter((p) => p.es_recurrente && !p.pagado)
    setSusData(suscripciones)
    setLoading(false)
  }

  useEffect(() => { analyze() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análisis con IA</h1>
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-blue-200 text-sm">Gastado este mes</p>
                <p className="text-3xl font-bold">${data.total_gastado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Ahorro potencial</p>
                <p className="text-3xl font-bold text-green-300">~${data.ahorro_total.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm">{data.cantidad_pagos} pagos registrados</p>
          </div>

          <div className="space-y-3">
            {data.recomendaciones.map((r, i) => (
              <div key={i} className={`card flex items-start gap-4 ${r.tipo === 'gasto_alto' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''}`}>
                <div className="text-2xl">{r.icono}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{r.titulo}</h3>
                    {r.ahorro > 0 && <span className="text-sm font-bold text-green-600 dark:text-green-400">-${r.ahorro}</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.mensaje}</p>
                </div>
              </div>
            ))}
          </div>

          {susData && susData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <HiBan className="text-red-500" /> Suscripciones activas
              </h3>
              <div className="space-y-2">
                {susData.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <span className="font-medium">{s.concepto}</span>
                      <span className="text-sm text-gray-500 ml-2">{s.categoria}</span>
                    </div>
                    <span className="font-bold">${parseFloat(s.monto).toFixed(2)}/mes</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Total en suscripciones: <strong className="text-gray-800 dark:text-gray-200">${susData.reduce((a, s) => a + parseFloat(s.monto), 0).toFixed(2)}/mes</strong>
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
