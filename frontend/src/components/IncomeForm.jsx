import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const metodosCobro = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

export default function IncomeForm({ onSuccess, editItem, onCancelEdit }) {
  const [form, setForm] = useState({
    concepto: '', monto: '', categoria: 'Salario', descripcion: '',
    metodo_pago: 'transferencia', fecha: '', cobrado: true,
  })
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').eq('tipo', 'ingreso').order('id').then(({ data }) => {
      if (data?.length) setCategorias(data)
    })
  }, [])

  useEffect(() => {
    if (editItem) {
      setForm({
        concepto: editItem.concepto || '',
        monto: editItem.monto?.toString() || '',
        categoria: editItem.categoria || 'Salario',
        descripcion: editItem.descripcion || '',
        metodo_pago: editItem.metodo_pago || 'transferencia',
        fecha: editItem.fecha || '',
        cobrado: editItem.cobrado ?? true,
      })
    }
  }, [editItem])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.concepto || !form.monto || !form.fecha) return
    setLoading(true)

    const payload = {
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      categoria: form.categoria,
      descripcion: form.descripcion,
      metodo_pago: form.metodo_pago,
      fecha: form.fecha,
      cobrado: form.cobrado,
    }

    if (editItem) {
      await supabase.from('ingresos').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('ingresos').insert([payload])
    }

    resetForm()
    onSuccess?.()
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ concepto: '', monto: '', categoria: 'Salario', descripcion: '', metodo_pago: 'transferencia', fecha: '', cobrado: true })
    onCancelEdit?.()
  }

  const displayCats = categorias.length ? categorias : [
    { id: 1, nombre: 'Salario', icono: '💰' },
    { id: 2, nombre: 'Freelance', icono: '💻' },
    { id: 3, nombre: 'Inversiones', icono: '📈' },
    { id: 4, nombre: 'Varios', icono: '📦' },
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{editItem ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h2>
        {editItem && (
          <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="concepto" value={form.concepto} onChange={handleChange} placeholder="Concepto (ej: Salario, Proyecto X)" className="input col-span-2" required />
        <input name="monto" type="number" step="0.01" value={form.monto} onChange={handleChange} placeholder="Monto $" className="input" required />
        <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input" required />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</p>
        <div className="flex flex-wrap gap-1.5">
          {displayCats.map((c) => (
            <button key={c.id} type="button" onClick={() => setForm((f) => ({ ...f, categoria: c.nombre }))}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                form.categoria === c.nombre
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-2 ring-green-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >{c.icono || '💰'} {c.nombre}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="input">
          {metodosCobro.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción (opcional)" className="input" rows="2" />

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="cobrado" checked={form.cobrado} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
        <span>Ya fue cobrado</span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Guardando...' : editItem ? 'Guardar Cambios' : 'Agregar Ingreso'}
      </button>
    </form>
  )
}
