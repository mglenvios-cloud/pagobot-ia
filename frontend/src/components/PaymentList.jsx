import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiCheck, HiTrash, HiBell, HiPencil } from 'react-icons/hi'

export default function PaymentList({ refreshKey, onEdit }) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  const load = async () => {
    const { data } = await supabase.from('pagos').select('*').order('fecha_vencimiento', { ascending: true })
    if (data) setPagos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])

  const togglePagado = async (id, pagado) => {
    await supabase.from('pagos').update({ pagado, fecha_pago: pagado ? new Date().toISOString().split('T')[0] : null }).eq('id', id)
    load()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este pago?')) return
    await supabase.from('pagos').delete().eq('id', id)
    load()
  }

  const recordatorio = (pago) => {
    const num = import.meta.env.VITE_WHATSAPP_NUMBER
    const msg = encodeURIComponent(`🤖 *PagoBot IA*\n\n📌 *${pago.concepto}* - $${pago.monto}\n📅 Vence: ${pago.fecha_vencimiento}\n\n⚠️ No olvides pagar!`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  const filtered = pagos.filter((p) => {
    if (filter === 'pendientes') return !p.pagado
    if (filter === 'pagados') return p.pagado
    if (filter === 'vencidos') return !p.pagado && new Date(p.fecha_vencimiento) < new Date()
    return true
  })

  if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[{ k: 'todos', l: 'Todos' }, { k: 'pendientes', l: 'Pendientes' }, { k: 'pagados', l: 'Pagados' }, { k: 'vencidos', l: 'Vencidos' }].map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === k ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-400">No hay pagos</p>
      ) : (
        filtered.map((p) => {
          const diff = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 3600 * 24))
          const vencido = diff < 0
          const proximo = diff >= 0 && diff <= 3
          const recurrenciaLabel = { diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual', anual: 'Anual' }

          return (
            <div key={p.id} className={`card flex items-center gap-4 ${p.pagado ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{p.concepto}</span>
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{p.categoria}</span>
                  {p.es_recurrente && (
                    <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      {recurrenciaLabel[p.recurrencia_tipo] || 'Recurrente'}
                    </span>
                  )}
                  {p.metodo_pago === 'debito_automatico' && (
                    <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Débito</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-gray-800 dark:text-gray-200">${parseFloat(p.monto).toFixed(2)}</span>
                  <span>📅 {p.fecha_vencimiento}</span>
                  {vencido && <span className="badge-overdue">VENCIDO</span>}
                  {proximo && !vencido && <span className="badge-pending">Próximo</span>}
                  {p.pagado && <span className="badge-paid">Pagado</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!p.pagado && (
                  <button onClick={() => recordatorio(p)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl" title="WhatsApp">
                    <HiBell className="text-lg" />
                  </button>
                )}
                <button onClick={() => onEdit?.(p)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl" title="Editar">
                  <HiPencil className="text-lg" />
                </button>
                <button onClick={() => togglePagado(p.id, !p.pagado)} className={`p-2 rounded-xl ${p.pagado ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} title={p.pagado ? 'Desmarcar' : 'Marcar pagado'}>
                  <HiCheck className="text-lg" />
                </button>
                <button onClick={() => eliminar(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl" title="Eliminar">
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
