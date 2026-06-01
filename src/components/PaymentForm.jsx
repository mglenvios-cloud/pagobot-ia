import { useState } from 'react'
import { supabase } from '../lib/supabase'

const categories = [
  'Servicio', 'Suscripción', 'Impuesto', 'Delivery',
  'Supermercado', 'Transporte', 'Salud', 'Otros',
]

export default function PaymentForm({ onPaymentAdded }) {
  const [form, setForm] = useState({
    concepto: '',
    monto: '',
    categoria: 'Servicio',
    fecha_vencimiento: '',
    es_recurrente: false,
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.concepto || !form.monto || !form.fecha_vencimiento) return
    setLoading(true)

    const { error } = await supabase.from('pagos').insert([{
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      categoria: form.categoria,
      fecha_vencimiento: form.fecha_vencimiento,
      es_recurrente: form.es_recurrente,
      pagado: false,
    }])

    if (!error) {
      setForm({ concepto: '', monto: '', categoria: 'Servicio', fecha_vencimiento: '', es_recurrente: false })
      onPaymentAdded?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Agregar Pago</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="concepto"
          value={form.concepto}
          onChange={handleChange}
          placeholder="Concepto (ej: Netflix, Luz)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        />
        <input
          name="monto"
          type="number"
          step="0.01"
          value={form.monto}
          onChange={handleChange}
          placeholder="Monto ($)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          name="fecha_vencimiento"
          type="date"
          value={form.fecha_vencimiento}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          name="es_recurrente"
          type="checkbox"
          checked={form.es_recurrente}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 rounded border-gray-300"
        />
        Pago recurrente (mensual)
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Agregar Pago'}
      </button>
    </form>
  )
}
