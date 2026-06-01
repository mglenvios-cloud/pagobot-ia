import { Router } from 'express'
import { supabase } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  const { fecha_desde, fecha_hasta, pagado, categoria } = req.query
  let query = supabase.from('pagos').select('*, categorias!inner(*)').order('fecha_vencimiento', { ascending: true })

  if (fecha_desde) query = query.gte('fecha_vencimiento', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha_vencimiento', fecha_hasta)
  if (pagado !== undefined) query = query.eq('pagado', pagado === 'true')
  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.get('/proximos', async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('pagado', false)
    .gte('fecha_vencimiento', hoy)
    .order('fecha_vencimiento', { ascending: true })
    .limit(10)

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.get('/vencidos', async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('pagado', false)
    .lt('fecha_vencimiento', hoy)
    .order('fecha_vencimiento', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.get('/calendario', async (req, res) => {
  const { mes, año } = req.query
  const m = mes || new Date().getMonth() + 1
  const a = año || new Date().getFullYear()
  const inicio = `${a}-${String(m).padStart(2, '0')}-01`
  const fin = new Date(a, m, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .gte('fecha_vencimiento', inicio)
    .lte('fecha_vencimiento', fin)
    .order('fecha_vencimiento', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.get('/dashboard', async (req, res) => {
  const hoy = new Date().toISOString().split('T')[0]
  const mesInicio = `${hoy.slice(0, 7)}-01`

  const [pagosMes, pagosPendientes, vencidos, pagados, ingresos, totalGastado] = await Promise.all([
    supabase.from('pagos').select('*, categorias!inner(*)').gte('fecha_vencimiento', mesInicio).lte('fecha_vencimiento', `${hoy.slice(0, 7)}-31`),
    supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('pagado', false),
    supabase.from('pagos').select('*').eq('pagado', false).lt('fecha_vencimiento', hoy),
    supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('pagado', true),
    supabase.from('ingresos').select('monto').gte('fecha', mesInicio).lte('fecha', `${hoy.slice(0, 7)}-31`),
    supabase.from('pagos').select('monto').eq('pagado', true).gte('fecha_vencimiento', mesInicio),
  ])

  const totalIngresos = ingresos.data?.reduce((a, i) => a + parseFloat(i.monto), 0) || 0
  const gastado = pagados.data?.reduce((a, p) => a + parseFloat(p.monto), 0) || 0

  res.json({
    total_gastado_mes: gastado,
    total_ingresos_mes: totalIngresos,
    balance: totalIngresos - gastado,
    pendientes: pendientes.count,
    vencidos: vencidos.data?.length || 0,
    realizados: pagados.count,
    pagos_mes: pagosMes.data || [],
  })
})

router.post('/', async (req, res) => {
  const { concepto, monto, categoria, categoria_id, fecha_vencimiento, es_recurrente, recurrencia_tipo, metodo_pago } = req.body
  if (!concepto || !monto || !fecha_vencimiento) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const { data, error } = await supabase.from('pagos').insert([{
    concepto, monto, categoria: categoria || 'Otros', categoria_id,
    fecha_vencimiento, es_recurrente: es_recurrente || false,
    recurrencia_tipo: recurrencia_tipo || 'mensual',
    metodo_pago: metodo_pago || 'debito_automatico',
    pagado: false,
  }]).select()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const updates = req.body

  if (updates.pagado === true) {
    updates.fecha_pago = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase.from('pagos').update(updates).eq('id', id).select()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('pagos').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
