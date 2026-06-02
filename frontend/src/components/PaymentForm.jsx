import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const metodosPago = [
  { value: 'debito_automatico', label: 'Débito Automático' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
]

export default function PaymentForm({ onSuccess, editItem, onCancelEdit }) {
  const [form, setForm] = useState({
    concepto: '', monto: '', categoria: 'Servicios', categoria_id: 1,
    fecha_vencimiento: '', es_recurrente: false, recurrencia_tipo: 'mensual',
    metodo_pago: 'debito_automatico',
  })
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').order('id').then(({ data }) => {
      if (data?.length) setCategorias(data)
    })
  }, [])

  useEffect(() => {
    if (editItem) {
      setForm({
        concepto: editItem.concepto || '',
        monto: editItem.monto?.toString() || '',
        categoria: editItem.categoria || 'Servicios',
        categoria_id: editItem.categoria_id || 1,
        fecha_vencimiento: editItem.fecha_vencimiento || '',
        es_recurrente: editItem.es_recurrente || false,
        recurrencia_tipo: editItem.recurrencia_tipo || 'mensual',
        metodo_pago: editItem.metodo_pago || 'debito_automatico',
      })
    }
  }, [editItem])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.concepto || !form.monto || !form.fecha_vencimiento) return
    setLoading(true)

    const payload = {
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      categoria: form.categoria,
      categoria_id: form.categoria_id,
      fecha_vencimiento: form.fecha_vencimiento,
      es_recurrente: form.es_recurrente,
      recurrencia_tipo: form.recurrencia_tipo,
      metodo_pago: form.metodo_pago,
    }

    if (editItem) {
      const { error } = await supabase.from('pagos').update(payload).eq('id', editItem.id)
      if (error) { alert('Error: ' + error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('pagos').insert([{ ...payload, pagado: false }])
      if (error) { alert('Error: ' + error.message); setLoading(false); return }
    }

    resetForm()
    onSuccess?.()
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ concepto: '', monto: '', categoria: 'Servicios', categoria_id: 1, fecha_vencimiento: '', es_recurrente: false, recurrencia_tipo: 'mensual', metodo_pago: 'debito_automatico' })
    onCancelEdit?.()
  }

  const displayCats = categorias.length ? categorias : [
    { id: 1, nombre: 'Servicios', icono: '💡' },
    { id: 2, nombre: 'Suscripciones', icono: '🔄' },
    { id: 3, nombre: 'Impuestos', icono: '🏛️' },
    { id: 4, nombre: 'Delivery', icono: '🍕' },
    { id: 5, nombre: 'Supermercado', icono: '🛒' },
    { id: 6, nombre: 'Transporte', icono: '🚗' },
    { id: 7, nombre: 'Salud', icono: '💊' },
    { id: 8, nombre: 'Entretenimiento', icono: '🎬' },
    { id: 9, nombre: 'Otros', icono: '📦' },
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{editItem ? 'Editar Pago' : 'Nuevo Pago'}</h2>
        {editItem && (
          <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="concepto" value={form.concepto} onChange={handleChange} placeholder="Concepto (ej: Netflix, Luz)" className="input col-span-2" required />
        <input name="monto" type="number" step="0.01" value={form.monto} onChange={handleChange} placeholder="Monto $" className="input" required />
        <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={handleChange} className="input" required />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</p>
        <div className="flex flex-wrap gap-1.5">
          {displayCats.map((c) => (
            <button key={c.id} type="button" onClick={() => setForm((f) => ({ ...f, categoria: c.nombre, categoria_id: c.id }))}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                form.categoria === c.nombre
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >{c.icono || '📦'} {c.nombre}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="input">
          {metodosPago.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select name="recurrencia_tipo" value={form.recurrencia_tipo} onChange={handleChange} className="input" disabled={!form.es_recurrente}>
          <option value="diario">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="es_recurrente" checked={form.es_recurrente} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span>Pago recurrente</span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Guardando...' : editItem ? 'Guardar Cambios' : 'Agregar Pago'}
      </button>
    </form>
  )
}
