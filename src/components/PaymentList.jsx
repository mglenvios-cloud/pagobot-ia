import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { HiCheck, HiTrash, HiBell } from 'react-icons/hi'

export default function PaymentList() {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPagos = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('fecha_vencimiento', { ascending: true })

    if (!error) setPagos(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPagos() }, [])

  const marcarPagado = async (id, pagado) => {
    await supabase.from('pagos').update({ pagado }).eq('id', id)
    loadPagos()
  }

  const eliminar = async (id) => {
    await supabase.from('pagos').delete().eq('id', id)
    loadPagos()
  }

  const enviarRecordatorio = async (pago) => {
    const numero = import.meta.env.VITE_WHATSAPP_NUMBER
    if (!numero) return alert('Configurá VITE_WHATSAPP_NUMBER en .env')

    const mensaje = encodeURIComponent(
      `🤖 *PagoBot IA - Recordatorio*\n\n📌 ${pago.concepto}\n💰 $${pago.monto}\n📅 Vence: ${pago.fecha_vencimiento}\n\n¡No te olvides de pagar!`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Cargando pagos...</div>

  const pending = pagos.filter((p) => !p.pagado)
  const done = pagos.filter((p) => p.pagado)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Próximos Pagos ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">No tenés pagos pendientes 🎉</p>
        ) : (
          <div className="space-y-2">
            {pending.map((pago) => (
              <Item
                key={pago.id}
                pago={pago}
                onToggle={() => marcarPagado(pago.id, true)}
                onDelete={() => eliminar(pago.id)}
                onRemind={() => enviarRecordatorio(pago)}
              />
            ))}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Pagados</h3>
          <div className="space-y-2 opacity-60">
            {done.map((pago) => (
              <Item
                key={pago.id}
                pago={pago}
                onToggle={() => marcarPagado(pago.id, false)}
                onDelete={() => eliminar(pago.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Item({ pago, onToggle, onDelete, onRemind }) {
  const vence = new Date(pago.fecha_vencimiento)
  const hoy = new Date()
  const diffDays = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))

  const vencido = diffDays < 0
  const proximo = diffDays >= 0 && diffDays <= 3

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        vencido
          ? 'bg-red-50 border-red-200'
          : proximo
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800">{pago.concepto}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {pago.categoria}
          </span>
          {pago.es_recurrente && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
              Recurrente
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">${pago.monto}</span>
          <span>Vence: {pago.fecha_vencimiento}</span>
          {vencido && <span className="text-red-600 font-medium">VENCIDO</span>}
          {proximo && !vencido && <span className="text-yellow-600 font-medium">Próximo</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4">
        {onRemind && (
          <button onClick={onRemind} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Recordatorio WhatsApp">
            <HiBell className="text-lg" />
          </button>
        )}
        <button onClick={onToggle} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Marcar pagado">
          <HiCheck className="text-lg" />
        </button>
        <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
          <HiTrash className="text-lg" />
        </button>
      </div>
    </div>
  )
}
