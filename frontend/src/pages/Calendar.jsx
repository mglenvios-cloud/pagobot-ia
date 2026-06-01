import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import PaymentDetail from '../components/PaymentDetail'
import PaymentForm from '../components/PaymentForm'
import IncomeForm from '../components/IncomeForm'
import { HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi'

export default function Calendar() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [año, setAño] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [vista, setVista] = useState('mes')
  const [selectedPago, setSelectedPago] = useState(null)
  const [editPago, setEditPago] = useState(null)
  const [showIncomeForm, setShowIncomeForm] = useState(false)

  useEffect(() => {
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0]
    Promise.all([
      supabase.from('pagos').select('*').gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).order('fecha_vencimiento'),
      supabase.from('ingresos').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha'),
    ]).then(([pagosRes, ingresosRes]) => {
      setPagos(pagosRes.data || [])
      setIngresos(ingresosRes.data || [])
    })
  }, [mes, año])

  const daysInMonth = new Date(año, mes + 1, 0).getDate()
  const firstDay = new Date(año, mes, 1).getDay()
  const monthName = new Date(año, mes).toLocaleString('es', { month: 'long' })

  const prev = () => { if (mes === 0) { setMes(11); setAño((a) => a - 1) } else setMes((m) => m - 1); setSelectedDay(null); setSelectedPago(null) }
  const next = () => { if (mes === 11) { setMes(0); setAño((a) => a + 1) } else setMes((m) => m + 1); setSelectedDay(null); setSelectedPago(null) }
  const goToday = () => { setMes(hoy.getMonth()); setAño(hoy.getFullYear()); setSelectedDay(hoy.getDate()) }

  const getPagosDay = (day) => {
    const date = `${año}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return pagos.filter((p) => p.fecha_vencimiento === date)
  }

  const getIngresosDay = (day) => {
    const date = `${año}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return ingresos.filter((i) => i.fecha === date)
  }

  const togglePagado = async (id, pagado) => {
    await supabase.from('pagos').update({ pagado, fecha_pago: pagado ? new Date().toISOString().split('T')[0] : null }).eq('id', id)
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase.from('ingresos').select('*').gte('fecha', inicio).lte('fecha', fin)
    const { data: pagosData } = await supabase.from('pagos').select('*').gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin)
    setPagos(pagosData || [])
    if (data) setIngresos(data)
  }

  const eliminarPago = async (id) => {
    await supabase.from('pagos').delete().eq('id', id)
    setPagos((prev) => prev.filter((p) => p.id !== id))
  }

  const recordatorio = (pago) => {
    const num = import.meta.env.VITE_WHATSAPP_NUMBER
    const msg = encodeURIComponent(`🤖 *PagoBot IA*\n\n📌 *${pago.concepto}* - $${pago.monto}\n📅 Vence: ${pago.fecha_vencimiento}\n\n⚠️ No olvides pagar!`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  const refreshMonth = async () => {
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0]
    const [pagosRes, ingresosRes] = await Promise.all([
      supabase.from('pagos').select('*').gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).order('fecha_vencimiento'),
      supabase.from('ingresos').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha'),
    ])
    setPagos(pagosRes.data || [])
    setIngresos(ingresosRes.data || [])
    setEditPago(null)
    setShowIncomeForm(false)
    setSelectedPago(null)
  }

  const selectedPagos = selectedDay ? getPagosDay(selectedDay) : []
  const selectedIngresos = selectedDay ? getIngresosDay(selectedDay) : []

  const semanaStart = new Date(año, mes, selectedDay || hoy.getDate())
  const diaSemana = semanaStart.getDay()
  semanaStart.setDate(semanaStart.getDate() - diaSemana)
  const semanaDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const totalMes = pagos.reduce((a, p) => a + parseFloat(p.monto), 0)
  const ingresosMes = ingresos.reduce((a, i) => a + parseFloat(i.monto), 0)
  const pendientesMes = pagos.filter((p) => !p.pagado).length
  const pagadosMes = pagos.filter((p) => p.pagado).length

  return (
    <div className="space-y-6">
      {editPago && (
        <PaymentForm onSuccess={refreshMonth} editItem={editPago} onCancelEdit={() => setEditPago(null)} />
      )}

      {showIncomeForm && (
        <IncomeForm onSuccess={refreshMonth} onCancelEdit={() => setShowIncomeForm(false)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowIncomeForm(true)} className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium flex items-center gap-1">
            <HiPlus /> Ingreso
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-medium">Hoy</button>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
            {['mes', 'semana'].map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-all ${vista === v ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}>
                {v === 'mes' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card text-center"><p className="text-xs text-gray-500">Gastos</p><p className="text-lg font-bold text-red-600">${fmt(totalMes)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Ingresos</p><p className="text-lg font-bold text-green-600">+${fmt(ingresosMes)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Pendientes</p><p className="text-lg font-bold text-yellow-600">{pendientesMes}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Pagados</p><p className="text-lg font-bold text-green-600">{pagadosMes}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><HiChevronLeft className="text-xl" /></button>
          <h2 className="text-lg font-bold capitalize">{monthName} {año}</h2>
          <button onClick={next} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><HiChevronRight className="text-xl" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPagos = getPagosDay(day)
            const dayIngresos = getIngresosDay(day)
            const isToday = day === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
            const isSelected = selectedDay === day
            const hasVencido = dayPagos.some((p) => !p.pagado && new Date(p.fecha_vencimiento) < new Date())
            const hasPendiente = dayPagos.some((p) => !p.pagado)
            const hasPagado = dayPagos.some((p) => p.pagado)
            const hasIngreso = dayIngresos.length > 0

            return (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all ${
                  isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                  isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                  'hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${hasVencido ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}
              >
                {day}
                <div className="flex gap-0.5 mt-0.5">
                  {hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  {hasPendiente && !hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                  {hasPagado && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  {hasIngreso && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </div>
                {(dayPagos.length > 0 || dayIngresos.length > 0) && (
                  <span className="text-[9px] mt-0.5 opacity-70">{dayPagos.length + dayIngresos.length}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vista semanal */}
      {vista === 'semana' && (
        <div className="card">
          <h3 className="font-semibold mb-3">Vista Semanal</h3>
          <div className="space-y-2">
            {semanaDays.map((d) => {
              const dayStr = d.toISOString().split('T')[0]
              const dayPagos = pagos.filter((p) => p.fecha_vencimiento === dayStr)
              const dayIngresos = ingresos.filter((i) => i.fecha === dayStr)
              const isHoy = dayStr === hoy.toISOString().split('T')[0]
              const totalDia = dayPagos.reduce((a, p) => a + parseFloat(p.monto), 0)
              const ingresosDia = dayIngresos.reduce((a, i) => a + parseFloat(i.monto), 0)
              return (
                <div key={dayStr} className={`p-3 rounded-xl ${isHoy ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isHoy ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {d.toLocaleDateString('es', { weekday: 'long' })} {d.getDate()}
                    </span>
                    <div className="text-right">
                      {ingresosDia > 0 && <span className="text-sm font-bold text-green-600 block">+${fmt(ingresosDia)}</span>}
                      {totalDia > 0 && <span className="text-sm font-bold text-red-600 block">-${fmt(totalDia)}</span>}
                    </div>
                  </div>
                  {dayPagos.length === 0 && dayIngresos.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin movimientos</p>
                  ) : (
                    <>
                      {dayPagos.map((p) => (
                        <button key={p.id} onClick={() => setSelectedPago(p)} className="w-full flex items-center justify-between text-sm ml-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1">
                          <span>💳 {p.concepto} {p.pagado ? '✅' : '⏳'}</span>
                          <span className="font-medium">${fmt(p.monto)}</span>
                        </button>
                      ))}
                      {dayIngresos.map((i) => (
                        <div key={i.id} className="flex items-center justify-between text-sm ml-2 py-0.5">
                          <span>💰 {i.concepto} {i.cobrado ? '✅' : '⏳'}</span>
                          <span className="font-medium text-green-600">+${fmt(i.monto)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Movimientos del día seleccionado */}
      {selectedDay && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Movimientos del {selectedDay}/{mes + 1}</h3>
            <div className="text-right">
              {selectedIngresos.length > 0 && (
                <div className="text-sm font-bold text-green-600">
                  +${fmt(selectedIngresos.reduce((a, i) => a + parseFloat(i.monto), 0))}
                </div>
              )}
              {selectedPagos.length > 0 && (
                <div className="text-sm font-bold text-red-600">
                  -${fmt(selectedPagos.reduce((a, p) => a + parseFloat(p.monto), 0))}
                </div>
              )}
            </div>
          </div>

          {/* Ingresos del día */}
          {selectedIngresos.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-2">Ingresos</p>
              {selectedIngresos.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">💰 {i.concepto}</span>
                      <span className="badge bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">{i.categoria}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {i.metodo_pago && <span>{i.metodo_pago} · </span>}
                      {i.descripcion && <span>{i.descripcion}</span>}
                    </div>
                  </div>
                  <span className="font-bold text-green-600">+${fmt(i.monto)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pagos del día */}
          {selectedPagos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">Pagos</p>
              {selectedPagos.map((p) => (
                <button key={p.id} onClick={() => setSelectedPago(p)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.concepto}</span>
                      <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{p.categoria}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {p.metodo_pago === 'debito_automatico' ? 'Débito Automático' : p.metodo_pago === 'efectivo' ? 'Efectivo' : p.metodo_pago === 'transferencia' ? 'Transferencia' : p.metodo_pago === 'tarjeta' ? 'Tarjeta' : p.metodo_pago} · {p.pagado ? '✅ Pagado' : '⏳ Pendiente'}
                      {p.es_recurrente && ` · ${p.recurrencia_tipo === 'diario' ? 'Diario' : p.recurrencia_tipo === 'semanal' ? 'Semanal' : p.recurrencia_tipo === 'mensual' ? 'Mensual' : 'Anual'}`}
                    </div>
                  </div>
                  <span className="font-bold">${fmt(p.monto)}</span>
                </button>
              ))}
            </div>
          )}

          {selectedPagos.length === 0 && selectedIngresos.length === 0 && (
            <p className="text-center py-4 text-gray-400">Sin movimientos este día</p>
          )}
        </div>
      )}

      {/* PaymentDetail modal */}
      {selectedPago && (
        <PaymentDetail
          pago={selectedPago}
          onClose={() => setSelectedPago(null)}
          onEdit={(p) => { setSelectedPago(null); setEditPago(p) }}
          onTogglePagado={(id, pagado) => togglePagado(id, pagado)}
          onEliminar={(id) => { eliminarPago(id); setSelectedPago(null) }}
          onRecordatorio={(p) => recordatorio(p)}
        />
      )}

      <div className="flex gap-4 text-sm text-gray-500 justify-center flex-wrap">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Vencido</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pendiente</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Pagado</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Ingreso</span>
      </div>
    </div>
  )
}
