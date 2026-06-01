import { HiX, HiPencil, HiCheck, HiTrash, HiBell } from 'react-icons/hi'

const metodoLabels = {
  debito_automatico: 'Débito Automático',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

const recurrenciaLabels = {
  diario: 'Diaria',
  semanal: 'Semanal',
  mensual: 'Mensual',
  anual: 'Anual',
}

export default function PaymentDetail({ pago, onClose, onEdit, onTogglePagado, onEliminar, onRecordatorio }) {
  if (!pago) return null

  const diff = Math.ceil((new Date(pago.fecha_vencimiento) - new Date()) / (1000 * 3600 * 24))
  const vencido = diff < 0
  const proximo = diff >= 0 && diff <= 3

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Detalle del Pago</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <HiX className="text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold">{pago.concepto}</h4>
              <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mt-1 inline-block">{pago.categoria}</span>
            </div>
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">${parseFloat(pago.monto).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <div>
              <p className="text-xs text-gray-500">Vencimiento</p>
              <p className="font-semibold">{pago.fecha_vencimiento}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estado</p>
              <p className={`font-semibold ${pago.pagado ? 'text-green-600' : vencido ? 'text-red-600' : 'text-yellow-600'}`}>
                {pago.pagado ? '✅ Pagado' : vencido ? '⛔ Vencido' : proximo ? '⚠️ Próximo' : '⏳ Pendiente'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Método de Pago</p>
              <p className="font-semibold">{metodoLabels[pago.metodo_pago] || pago.metodo_pago}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Recurrencia</p>
              <p className="font-semibold">{pago.es_recurrente ? (recurrenciaLabels[pago.recurrencia_tipo] || 'Recurrente') : 'Sin recurrencia'}</p>
            </div>
            {pago.fecha_pago && (
              <div>
                <p className="text-xs text-gray-500">Pagado el</p>
                <p className="font-semibold">{pago.fecha_pago}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!pago.pagado && (
              <button onClick={() => { onRecordatorio?.(pago); onClose() }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <HiBell className="text-lg" /> WhatsApp
              </button>
            )}
            <button onClick={() => { onTogglePagado?.(pago.id, !pago.pagado); onClose() }} className={`flex-1 flex items-center justify-center gap-2 ${pago.pagado ? 'btn-secondary' : 'btn-primary'}`}>
              <HiCheck className="text-lg" /> {pago.pagado ? 'Desmarcar' : 'Marcar Pagado'}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { onEdit?.(pago); onClose() }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <HiPencil className="text-lg" /> Editar
            </button>
            <button onClick={() => { if (confirm('¿Eliminar este pago?')) { onEliminar?.(pago.id); onClose() } }} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 border-red-200 dark:border-red-800">
              <HiTrash className="text-lg" /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
