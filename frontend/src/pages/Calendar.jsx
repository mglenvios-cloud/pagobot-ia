import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiChevronLeft, HiChevronRight, HiCheck, HiTrash, HiBell } from 'react-icons/hi'

export default function Calendar() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [año, setAño] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [vista, setVista] = useState('mes') // mes | semana

  useEffect(() => {
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0]
    supabase.from('pagos').select('*').gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).order('fecha_vencimiento').then(({ data }) => setPagos(data || []))
  }, [mes, año])

  const daysInMonth = new Date(año, mes + 1, 0).getDate()
  const firstDay = new Date(año, mes, 1).getDay()
  const monthName = new Date(año, mes).toLocaleString('es', { month: 'long' })

  const prev = () => { if (mes === 0) { setMes(11); setAño((a) => a - 1) } else setMes((m) => m - 1); setSelectedDay(null) }
  const next = () => { if (mes === 11) { setMes(0); setAño((a) => a + 1) } else setMes((m) => m + 1); setSelectedDay(null) }

  const goToday = () => { setMes(hoy.getMonth()); setAño(hoy.getFullYear()); setSelectedDay(hoy.getDate()) }

  const getPagosDay = (day) => {
    const date = `${año}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return pagos.filter((p) => p.fecha_vencimiento === date)
  }

  const togglePagado = async (id, pagado) => {
    await supabase.from('pagos').update({ pagado, fecha_pago: pagado ? new Date().toISOString().split('T')[0] : null }).eq('id', id)
    const { data } = await supabase.from('pagos').select('*').gte('fecha_vencimiento', `${año}-${String(mes + 1).padStart(2, '0')}-01`).lte('fecha_vencimiento', new Date(año, mes + 1, 0).toISOString().split('T')[0]).order('fecha_vencimiento')
    setPagos(data || [])
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este pago?')) return
    await supabase.from('pagos').delete().eq('id', id)
    setPagos((prev) => prev.filter((p) => p.id !== id))
  }

  const recordatorio = (pago) => {
    const num = import.meta.env.VITE_WHATSAPP_NUMBER
    const msg = encodeURIComponent(`🤖 *PagoBot IA*\n\n📌 *${pago.concepto}* - $${pago.monto}\n📅 Vence: ${pago.fecha_vencimiento}\n\n⚠️ No olvides pagar!`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  const selectedPagos = selectedDay ? getPagosDay(selectedDay) : []

  // Calcular semana actual
  const semanaStart = new Date(año, mes, selectedDay || hoy.getDate())
  const diaSemana = semanaStart.getDay()
  semanaStart.setDate(semanaStart.getDate() - diaSemana)
  const semanaDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const totalMes = pagos.reduce((a, p) => a + parseFloat(p.monto), 0)
  const pendientesMes = pagos.filter((p) => !p.pagado).length
  const pagadosMes = pagos.filter((p) => p.pagado).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex gap-2">
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

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">${totalMes.toFixed(2)}</p></div>
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
            const isToday = day === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
            const isSelected = selectedDay === day
            const hasVencido = dayPagos.some((p) => !p.pagado && new Date(p.fecha_vencimiento) < new Date())
            const hasPendiente = dayPagos.some((p) => !p.pagado)
            const hasPagado = dayPagos.some((p) => p.pagado)

            return (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all ${
                  isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                  isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                  'hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${hasVencido ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}
              >
                {day}
                {dayPagos.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {hasPendiente && !hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                    {hasPagado && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                )}
                {dayPagos.length > 0 && (
                  <span className="text-[9px] mt-0.5 opacity-70">{dayPagos.length}</span>
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
              const isHoy = dayStr === hoy.toISOString().split('T')[0]
              return (
                <div key={dayStr} className={`p-3 rounded-xl ${isHoy ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isHoy ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {d.toLocaleDateString('es', { weekday: 'long' })} {d.getDate()}
                    </span>
                    {dayPagos.length > 0 && <span className="text-sm font-bold">{dayPagos.reduce((a, p) => a + parseFloat(p.monto), 0).toFixed(2)}</span>}
                  </div>
                  {dayPagos.length === 0 ? <p className="text-xs text-gray-400">Sin pagos</p> : dayPagos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm ml-2">
                      <span>{p.concepto} {p.pagado ? '✅' : '⏳'}</span>
                      <span className="font-medium">${parseFloat(p.monto).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagos del día seleccionado */}
      {selectedPagos.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Pagos del {selectedDay}/{mes + 1}</h3>
            <span className="text-sm font-bold text-blue-600">${selectedPagos.reduce((a, p) => a + parseFloat(p.monto), 0).toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            {selectedPagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.concepto}</span>
                    <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{p.categoria}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    ${parseFloat(p.monto).toFixed(2)} {p.pagado ? '✅ Pagado' : '⏳ Pendiente'}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!p.pagado && (
                    <button onClick={() => recordatorio(p)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"><HiBell className="text-lg" /></button>
                  )}
                  <button onClick={() => togglePagado(p.id, !p.pagado)} className={`p-2 rounded-xl ${p.pagado ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}><HiCheck className="text-lg" /></button>
                  <button onClick={() => eliminar(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><HiTrash className="text-lg" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-sm text-gray-500 justify-center flex-wrap">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Vencido</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Pendiente</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> Pagado</span>
      </div>
    </div>
  )
}
