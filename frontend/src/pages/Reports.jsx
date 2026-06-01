import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generarPDF, printReport } from '../lib/pdfGenerator'
import { HiDownload, HiPrinter } from 'react-icons/hi'

export default function Reports() {
  const hoy = new Date()
  const [periodo, setPeriodo] = useState('mensual')
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    return d.toISOString().split('T')[0]
  })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const periodos = [
    { k: 'diario', l: 'Día' },
    { k: 'semanal', l: 'Semana' },
    { k: 'mensual', l: 'Mes' },
    { k: 'anual', l: 'Año' },
    { k: 'personalizado', l: 'Personalizado' },
  ]

  useEffect(() => {
    const now = new Date()
    let inicio, fin
    switch (periodo) {
      case 'diario':
        inicio = now.toISOString().split('T')[0]
        fin = inicio
        break
      case 'semanal':
        const d = new Date(now)
        d.setDate(d.getDate() - d.getDay())
        inicio = d.toISOString().split('T')[0]
        fin = now.toISOString().split('T')[0]
        break
      case 'mensual':
        inicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'anual':
        inicio = `${now.getFullYear()}-01-01`
        fin = `${now.getFullYear()}-12-31`
        break
      default:
        return
    }
    if (periodo !== 'personalizado') {
      setFechaInicio(inicio)
      setFechaFin(fin)
    }
  }, [periodo])

  useEffect(() => {
    if (!fechaInicio || !fechaFin) return
    setLoading(true)
    Promise.all([
      supabase.from('pagos').select('*').gte('fecha_vencimiento', fechaInicio).lte('fecha_vencimiento', fechaFin).order('fecha_vencimiento'),
      supabase.from('ingresos').select('*').gte('fecha', fechaInicio).lte('fecha', fechaFin).order('fecha'),
    ]).then(([pagosRes, ingresosRes]) => {
      const pagos = (pagosRes.data || []).map((p) => ({ ...p, type: 'expense' }))
      const ingresos = (ingresosRes.data || []).map((i) => ({ ...i, type: 'income', fecha_vencimiento: i.fecha }))
      const merged = [...pagos, ...ingresos].sort((a, b) => {
        const fa = a.fecha_vencimiento || a.fecha
        const fb = b.fecha_vencimiento || b.fecha
        return fa.localeCompare(fb)
      })
      setItems(merged)
      setLoading(false)
    })
  }, [fechaInicio, fechaFin])

  const periodoLabel = periodo === 'personalizado'
    ? `${fechaInicio} al ${fechaFin}`
    : periodo === 'diario' ? fechaInicio
    : periodo === 'semanal' ? `Semana del ${fechaInicio} al ${fechaFin}`
    : periodo === 'mensual' ? fechaInicio.slice(0, 7)
    : fechaInicio.slice(0, 4)

  const totalIngresos = items.filter((i) => i.type === 'income').reduce((a, i) => a + parseFloat(i.monto), 0)
  const totalGastos = items.filter((i) => i.type === 'expense').reduce((a, p) => a + parseFloat(p.monto), 0)
  const balance = totalIngresos - totalGastos
  const pendientes = items.filter((i) => i.type === 'expense' && !i.pagado).length
  const cobrados = items.filter((i) => i.type === 'income' && i.cobrado).length

  const handlePDF = () => {
    if (!window.jspdf) { alert('Librería PDF aún cargando. Intentá de nuevo.'); return }
    const label = periodo === 'personalizado' ? 'Personalizado' : periodos.find((p) => p.k === periodo)?.l
    generarPDF({
      titulo: `Reporte ${label} - ${periodoLabel}`,
      periodo: periodoLabel,
      totalIngresos,
      totalGastos,
      balance,
      items,
    })
  }

  const handlePrint = () => {
    const label = periodo === 'personalizado' ? 'Personalizado' : periodos.find((p) => p.k === periodo)?.l
    printReport({
      titulo: `Reporte ${label} - ${periodoLabel}`,
      items,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Exportá ingresos y gastos en PDF</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {periodos.map(({ k, l }) => (
          <button key={k} onClick={() => setPeriodo(k)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              periodo === k ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >{l}</button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Desde</p>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="input" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Hasta</p>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="input" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center"><p className="text-xs text-gray-500">Ingresos</p><p className="text-lg font-bold text-green-600">+${totalIngresos.toFixed(2)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Gastos</p><p className="text-lg font-bold text-red-600">-${totalGastos.toFixed(2)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Balance</p><p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>${balance.toFixed(2)}</p></div>
        <div className="card text-center"><p className="text-xs text-gray-500">Transacciones</p><p className="text-lg font-bold">{items.length}</p></div>
      </div>

      {pendientes > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-3 text-sm text-yellow-700 dark:text-yellow-400">
          ⚠️ {pendientes} pago{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} en este período
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Sin movimientos en este período</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-600 text-white sticky top-0">
                <tr>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Concepto</th>
                  <th className="text-left p-3">Categoría</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">Monto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 text-gray-500">{item.fecha_vencimiento || item.fecha}</td>
                    <td className="p-3 font-medium">{item.concepto}</td>
                    <td className="p-3"><span className="badge bg-gray-100 dark:bg-gray-800">{item.categoria || '-'}</span></td>
                    <td className="p-3">
                      {item.type === 'income' ? (
                        <span className="badge bg-green-100 dark:bg-green-900/30 text-green-600">Ingreso</span>
                      ) : (
                        <span className={`badge ${item.pagado ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'}`}>
                          {item.pagado ? 'Pagado' : 'Pendiente'}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}${parseFloat(item.monto).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
                <tr>
                  <td colSpan="4" className="p-3 text-right">Totales:</td>
                  <td className={`p-3 text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${balance.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex gap-3">
          <button onClick={handlePDF} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <HiDownload className="text-lg" /> Descargar PDF
          </button>
          <button onClick={handlePrint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <HiPrinter className="text-lg" /> Imprimir
          </button>
        </div>
      )}
    </div>
  )
}
