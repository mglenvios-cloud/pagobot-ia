import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { HiLightBulb, HiExclamation, HiTrendingUp } from 'react-icons/hi'

const recommendations = {
  delivery: {
    keywords: ['delivery', 'pedidos', 'rapp', 'uber eats', 'didi food', 'comida'],
    message: (total) => `Gastaste $${total} en delivery este mes. Podrías ahorrar cocinando en casa un par de veces por semana.`,
  },
  suscripciones: {
    keywords: ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'paramount', 'crunchyroll', 'apple music', 'youtube premium'],
    message: (total) => `Tenés $${total} en suscripciones. ¿Realmente usás todas? Podrías cancelar una y ahorrar.`,
  },
  salidas: {
    keywords: ['bar', 'restaurante', 'cine', 'salida', 'boletería'],
    message: (total) => `Gastaste $${total} en salidas. Probar con planes gratis o en casa te ayudaría a reducir gastos.`,
  },
}

export default function AIAnalysis() {
  const [analisis, setAnalisis] = useState([])
  const [totalGastos, setTotalGastos] = useState(0)

  useEffect(() => {
    const run = async () => {
      const hoy = new Date()
      const mesActual = hoy.toISOString().slice(0, 7)

      const { data } = await supabase
        .from('pagos')
        .select('*')
        .gte('fecha_vencimiento', `${mesActual}-01`)
        .lte('fecha_vencimiento', `${mesActual}-31`)

      if (!data) return

      const total = data.reduce((acc, p) => acc + (p.pagado ? p.monto : 0), 0)
      setTotalGastos(total)

      const results = []

      for (const [key, config] of Object.entries(recommendations)) {
        const coincidencias = data.filter((p) =>
          config.keywords.some((kw) => p.concepto.toLowerCase().includes(kw))
        )
        const totalCat = coincidencias.reduce((acc, p) => acc + p.monto, 0)
        if (coincidencias.length > 0) {
          results.push({
            tipo: key,
            mensaje: config.message(totalCat),
            monto: totalCat,
            icono: key === 'delivery' ? 'delivery' : key === 'suscripciones' ? 'sus' : 'salidas',
          })
        }
      }

      if (data.length > 0) {
        const max = Math.max(...data.map((p) => p.monto))
        const gastoMayor = data.find((p) => p.monto === max)
        if (gastoMayor && max > total * 0.3) {
          results.push({
            tipo: 'alto',
            mensaje: `⚠️ ${gastoMayor.concepto} ($${gastoMayor.monto}) representa más del 30% de tus gastos del mes. ¿Podés reducirlo?`,
            monto: gastoMayor.monto,
            icono: 'alto',
          })
        }
      }

      if (results.length === 0) {
        results.push({
          tipo: 'ok',
          mensaje: '✅ Todo bien con tus gastos este mes. ¡Seguí así!',
          monto: 0,
          icono: 'ok',
        })
      }

      setAnalisis(results)
    }

    run()
    const interval = setInterval(run, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <HiLightBulb className="text-2xl text-yellow-300" />
        <h2 className="text-lg font-semibold">Análisis IA de Gastos</h2>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold">${totalGastos.toFixed(2)}</span>
        <span className="text-blue-200 ml-2">gastados este mes</span>
      </div>

      <div className="space-y-3">
        {analisis.map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="mt-0.5">
              <HiExclamation className="text-xl text-yellow-300" />
            </div>
            <p className="text-sm text-blue-50">{item.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
