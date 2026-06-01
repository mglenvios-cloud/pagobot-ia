import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const categorias = [
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

const metodosPago = [
  { value: 'debito_automatico', label: 'Débito Automático' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
]

export default function PaymentForm({ onSuccess }) {
  const [form, setForm] = useState({
    concepto: '', monto: '', categoria: 'Servicios', categoria_id: 1,
    fecha_vencimiento: '', es_recurrente: false, recurrencia_tipo: 'mensual',
    metodo_pago: 'debito_automatico',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleCategoria = (nombre, id) => {
    setForm((f) => ({ ...f, categoria: nombre, categoria_id: id }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.concepto || !form.monto || !form.fecha_vencimiento) return
    setLoading(true)

    const { error } = await supabase.from('pagos').insert([{
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      categoria: form.categoria,
      categoria_id: form.categoria_id,
      fecha_vencimiento: form.fecha_vencimiento,
      es_recurrente: form.es_recurrente,
      recurrencia_tipo: form.recurrencia_tipo,
      metodo_pago: form.metodo_pago,
      pagado: false,
    }])

    if (!error) {
      setForm({ concepto: '', monto: '', categoria: 'Servicios', categoria_id: 1, fecha_vencimiento: '', es_recurrente: false, recurrencia_tipo: 'mensual', metodo_pago: 'debito_automatico' })
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-bold">Nuevo Pago</h2>

      <div className="grid grid-cols-2 gap-3">
        <input name="concepto" value={form.concepto} onChange={handleChange} placeholder="Concepto" className="input col-span-2" required />
        <input name="monto" type="number" step="0.01" value={form.monto} onChange={handleChange} placeholder="Monto" className="input" required />
        <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={handleChange} className="input" required />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</p>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoria(c.nombre, c.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                form.categoria === c.nombre
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {c.icono} {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="input">
          {metodosPago.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select name="recurrencia_tipo" value={form.recurrencia_tipo} onChange={handleChange} className="input" disabled={!form.es_recurrente}>
          <option value="mensual">Mensual</option>
          <option value="anual">Anual</option>
          <option value="semanal">Semanal</option>
        </select>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="es_recurrente" checked={form.es_recurrente} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span>Pago recurrente</span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Guardando...' : 'Agregar Pago'}
      </button>
    </form>
  )
}
