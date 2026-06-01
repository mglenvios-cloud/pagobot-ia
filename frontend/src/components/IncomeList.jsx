import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import { HiTrash, HiPencil, HiCheck } from 'react-icons/hi'

export default function IncomeList({ refreshKey, onEdit }) {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  const load = async () => {
    const { data } = await supabase.from('ingresos').select('*').order('fecha', { ascending: false })
    if (data) setIngresos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])

  const toggleCobrado = async (id, cobrado) => {
    await supabase.from('ingresos').update({ cobrado }).eq('id', id)
    load()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este ingreso?')) return
    await supabase.from('ingresos').delete().eq('id', id)
    load()
  }

  const filtered = ingresos.filter((i) => {
    if (filter === 'cobrados') return i.cobrado
    if (filter === 'pendientes') return !i.cobrado
    return true
  })

  if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[{ k: 'todos', l: 'Todos' }, { k: 'cobrados', l: 'Cobrados' }, { k: 'pendientes', l: 'Pendientes' }].map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === k ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-400">No hay ingresos</p>
      ) : (
        filtered.map((i) => {
          const metodoLabel = { transferencia: 'Transferencia', efectivo: 'Efectivo', tarjeta: 'Tarjeta', otro: 'Otro' }

          return (
            <div key={i.id} className={`card flex items-center gap-4 ${!i.cobrado ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{i.concepto}</span>
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{i.categoria}</span>
                  <span className="badge bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    {metodoLabel[i.metodo_pago] || i.metodo_pago}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-green-600 dark:text-green-400">+${fmt(i.monto)}</span>
                  <span>📅 {i.fecha}</span>
                  {i.cobrado ? <span className="badge-paid">Cobrado</span> : <span className="badge-overdue">Pendiente</span>}
                </div>
                {i.descripcion && (
                  <p className="text-xs text-gray-400 mt-1">{i.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit?.(i)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl" title="Editar">
                  <HiPencil className="text-lg" />
                </button>
                <button onClick={() => toggleCobrado(i.id, !i.cobrado)} className={`p-2 rounded-xl ${i.cobrado ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`} title={i.cobrado ? 'Marcar pendiente' : 'Marcar cobrado'}>
                  <HiCheck className="text-lg" />
                </button>
                <button onClick={() => eliminar(i.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl" title="Eliminar">
                  <HiTrash className="text-lg" />
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
