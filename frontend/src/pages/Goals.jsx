import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import { HiPlus, HiTrash, HiCheck, HiPencil } from 'react-icons/hi'

const colores = ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ca8a04']
const iconos = ['🎯', '💰', '🏠', '✈️', '🚗', '🎓', '💳', '🏦', '🛒', '📱']

export default function Goals() {
  const [objetivos, setObjetivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ nombre: '', monto_objetivo: '', monto_actual: '0', fecha_limite: '', icono: '🎯', color: '#2563eb' })

  const load = async () => {
    const { data } = await supabase.from('objetivos').select('*').order('created_at')
    if (data) setObjetivos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.monto_objetivo) return
    const payload = { ...form, monto_objetivo: parseFloat(form.monto_objetivo), monto_actual: parseFloat(form.monto_actual || 0) }
    if (editId) {
      await supabase.from('objetivos').update(payload).eq('id', editId)
    } else {
      await supabase.from('objetivos').insert([payload])
    }
    setShowForm(false)
    setEditId(null)
    setForm({ nombre: '', monto_objetivo: '', monto_actual: '0', fecha_limite: '', icono: '🎯', color: '#2563eb' })
    load()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    load()
  }

  const toggleCompletado = async (obj) => {
    await supabase.from('objetivos').update({ completado: !obj.completado }).eq('id', obj.id)
    load()
  }

  const editar = (obj) => {
    setForm({ nombre: obj.nombre, monto_objetivo: obj.monto_objetivo.toString(), monto_actual: obj.monto_actual.toString(), fecha_limite: obj.fecha_limite || '', icono: obj.icono, color: obj.color })
    setEditId(obj.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Objetivos de Ahorro</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ nombre: '', monto_objetivo: '', monto_actual: '0', fecha_limite: '', icono: '🎯', color: '#2563eb' }) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700 transition-all"
        ><HiPlus /> Nuevo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h3 className="font-semibold">{editId ? 'Editar' : 'Nuevo'} Objetivo</h3>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre (ej: Viaje a Europa)" className="input" required />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={form.monto_objetivo} onChange={(e) => setForm({ ...form, monto_objetivo: e.target.value })} placeholder="Meta $" className="input" required />
            <input type="number" step="0.01" value={form.monto_actual} onChange={(e) => setForm({ ...form, monto_actual: e.target.value })} placeholder="Ahorrado $" className="input" />
          </div>
          <input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} className="input" />
          <div>
            <p className="text-xs text-gray-500 mb-1">Icono</p>
            <div className="flex gap-2 flex-wrap">
              {iconos.map((ico) => (
                <button key={ico} type="button" onClick={() => setForm({ ...form, icono: ico })} className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl transition-all ${form.icono === ico ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{ico}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Color</p>
            <div className="flex gap-2">
              {colores.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Guardar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : objetivos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500">Creá tu primer objetivo de ahorro</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {objetivos.map((obj) => {
            const pct = Math.min(100, (parseFloat(obj.monto_actual) / parseFloat(obj.monto_objetivo)) * 100)
            return (
              <div key={obj.id} className={`card ${obj.completado ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{obj.icono}</span>
                    <div>
                      <p className="font-semibold">{obj.nombre}</p>
                      <p className="text-sm text-gray-500">{fmt(obj.monto_actual)} / {fmt(obj.monto_objetivo)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editar(obj)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><HiPencil /></button>
                    <button onClick={() => toggleCompletado(obj)} className={`p-2 rounded-xl ${obj.completado ? 'text-gray-400' : 'text-green-600'}`}><HiCheck /></button>
                    <button onClick={() => eliminar(obj.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><HiTrash /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: obj.color }} />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{pct.toFixed(0)}%</span>
                  {obj.fecha_limite && <span>Límite: {obj.fecha_limite}</span>}
                </div>
                {obj.completado && <p className="text-green-600 text-sm font-medium mt-1">✅ Completado</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
