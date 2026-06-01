import { Router } from 'express'
import { supabase } from '../index.js'

const router = Router()

const CATEGORIAS_GASTO = {
  delivery: ['delivery', 'pedidosya', 'rapp', 'uber eats', 'didi food', 'comida'],
  suscripciones: ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'paramount', 'crunchyroll', 'apple music', 'youtube premium', 'google one', 'icloud'],
  salidas: ['bar', 'restaurante', 'cine', 'salida', 'boletería', 'teatro'],
  transporte: ['uber', 'taxi', 'cabify', 'did', 'colectivo', 'subte', 'nafta'],
  supermercado: ['supermercado', 'super', 'chino', 'almacén', 'coto', 'disco', 'carrefour', 'dia'],
}

const RECOMENDACIONES = {
  delivery: {
    titulo: '🍕 Delivery',
    mensaje: (total) => `Gastaste $${total.toFixed(2)} en delivery. Cocinar en casa 2 veces por semana te ahorraría ~$${(total * 0.3).toFixed(2)} al mes.`,
    ahorro_potencial: 0.3,
  },
  suscripciones: {
    titulo: '🔄 Suscripciones',
    mensaje: (total, count) => `Tenés ${count} suscripciones por $${total.toFixed(2)}/mes. ${count > 2 ? '¿Realmente usás todas? Cancelar 1 te ahorraría ~$${(total / count * 0.8).toFixed(2)}.' : 'Considerá planes compartidos o anuales para ahorrar.'}`,
    ahorro_potencial: 0.2,
  },
  salidas: {
    titulo: '🎉 Salidas',
    mensaje: (total) => `Gastaste $${total.toFixed(2)} en salidas. Probar con 1 salida en casa por semana podría ahorrarte ~$${(total * 0.25).toFixed(2)}.`,
    ahorro_potencial: 0.25,
  },
  transporte: {
    titulo: '🚗 Transporte',
    mensaje: (total) => `Gastaste $${total.toFixed(2)} en transporte. Caminar o usar bici para tramos cortos te ahorraría $${(total * 0.15).toFixed(2)}.`,
    ahorro_potencial: 0.15,
  },
  supermercado: {
    titulo: '🛒 Supermercado',
    mensaje: (total) => `Gastaste $${total.toFixed(2)} en supermercado. Hacer una lista y comprar al por mayor te ayudaría a reducir $${(total * 0.1).toFixed(2)}.`,
    ahorro_potencial: 0.1,
  },
}

router.get('/mensual', async (req, res) => {
  const hoy = new Date()
  const mesActual = hoy.toISOString().slice(0, 7)
  const limite = `${mesActual}-31`

  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .gte('fecha_vencimiento', `${mesActual}-01`)
    .lte('fecha_vencimiento', limite)

  if (error) return res.status(400).json({ error: error.message })
  if (!data || data.length === 0) {
    return res.json({ total_gastado: 0, recomendaciones: [{ tipo: 'ok', mensaje: 'No hay gastos este mes aún.' }], ahorro_potencial_total: 0 })
  }

  const total = data.reduce((a, p) => a + (p.pagado ? parseFloat(p.monto) : 0), 0)
  const recomendaciones = []

  for (const [tipo, config] of Object.entries(CATEGORIAS_GASTO)) {
    const coincidencias = data.filter((p) =>
      config.keywords.some((kw) => p.concepto.toLowerCase().includes(kw))
    )
    if (coincidencias.length > 0) {
      const totalCat = coincidencias.reduce((a, p) => a + parseFloat(p.monto), 0)
      const rec = RECOMENDACIONES[tipo]
      recomendaciones.push({
        tipo,
        titulo: rec.titulo,
        mensaje: rec.mensaje(totalCat, coincidencias.length),
        monto: totalCat,
        cantidad: coincidencias.length,
        ahorro_potencial: totalCat * rec.ahorro_potencial,
      })
    }
  }

  const maxGasto = data.reduce((max, p) => (parseFloat(p.monto) > parseFloat(max.monto) ? p : max), data[0])
  if (maxGasto && parseFloat(maxGasto.monto) > total * 0.3) {
    recomendaciones.push({
      tipo: 'gasto_alto',
      titulo: '⚠️ Gasto Alto Detectado',
      mensaje: `${maxGasto.concepto} ($${parseFloat(maxGasto.monto).toFixed(2)}) representa más del 30% de tus gastos. ¿Podés reducirlo o buscar alternativas más económicas?`,
      monto: parseFloat(maxGasto.monto),
      ahorro_potencial: parseFloat(maxGasto.monto) * 0.15,
    })
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push({
      tipo: 'ok',
      titulo: '✅ Todo en orden',
      mensaje: 'Tus gastos están balanceados este mes. ¡Seguí así!',
      ahorro_potencial: 0,
    })
  }

  const ahorroTotal = recomendaciones.reduce((a, r) => a + (r.ahorro_potencial || 0), 0)

  res.json({
    total_gastado: total,
    cantidad_pagos: data.length,
    cantidad_pagados: data.filter((p) => p.pagado).length,
    recomendaciones,
    ahorro_potencial_total: ahorroTotal,
  })
})

router.get('/gastos-por-categoria', async (req, res) => {
  const hoy = new Date()
  const mesActual = hoy.toISOString().slice(0, 7)

  const { data, error } = await supabase
    .from('pagos')
    .select('categoria, monto')
    .gte('fecha_vencimiento', `${mesActual}-01`)
    .lte('fecha_vencimiento', `${mesActual}-31`)

  if (error) return res.status(400).json({ error: error.message })

  const porCategoria = {}
  for (const p of data || []) {
    const cat = p.categoria || 'Otros'
    porCategoria[cat] = (porCategoria[cat] || 0) + parseFloat(p.monto)
  }

  res.json(porCategoria)
})

router.get('/suscripciones', async (req, res) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('es_recurrente', true)
    .eq('pagado', false)
    .order('monto', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  const recomendaciones = []
  const total = data?.reduce((a, p) => a + parseFloat(p.monto), 0) || 0

  if (data && data.length > 3) {
    const ultimas = data.slice(-2)
    for (const s of ultimas) {
      recomendaciones.push({
        concepto: s.concepto,
        monto: parseFloat(s.monto),
        mensaje: `¿Realmente necesitás ${s.concepto}? Son $${parseFloat(s.monto).toFixed(2)}/mes que podrías ahorrar.`,
      })
    }
  }

  res.json({
    total_suscripciones: data?.length || 0,
    total_mensual: total,
    suscripciones: data || [],
    recomendaciones_cancelar: recomendaciones,
  })
})

export default router
