import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PaymentForm from '../components/PaymentForm'
import PaymentList from '../components/PaymentList'
import IncomeForm from '../components/IncomeForm'
import IncomeList from '../components/IncomeList'
import { HiArrowUp, HiArrowDown, HiExclamation, HiCreditCard } from 'react-icons/hi'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [editItem, setEditItem] = useState(null)
  const [editIncome, setEditIncome] = useState(null)
  const [stats, setStats] = useState({ gastado: 0, ingresos: 0, pendientes: 0, vencidos: 0, realizados: 0 })
  const [showIncomeForm, setShowIncomeForm] = useState(false)

  const loadStats = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const mes = hoy.slice(0, 7)

    const [pagosRes, ingresosRes] = await Promise.all([
      supabase.from('pagos').select('*').gte('fecha_vencimiento', `${mes}-01`).lte('fecha_vencimiento', `${mes}-31`),
      supabase.from('ingresos').select('monto').gte('fecha', `${mes}-01`).lte('fecha', `${mes}-31`),
    ])

    const data = pagosRes.data || []
    const vencidos = data.filter((p) => !p.pagado && new Date(p.fecha_vencimiento) < new Date())

    setStats({
      gastado: data.filter((p) => p.pagado).reduce((a, p) => a + parseFloat(p.monto), 0),
      ingresos: (ingresosRes.data || []).reduce((a, i) => a + parseFloat(i.monto), 0),
      pendientes: data.filter((p) => !p.pagado).length,
      vencidos: vencidos.length,
      realizados: data.filter((p) => p.pagado).length,
    })
  }

  useEffect(() => { loadStats() }, [refreshKey])

  const handleEdit = (pago) => {
    setEditItem(pago)
    setEditIncome(null)
    setShowIncomeForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditIncome = (ingreso) => {
    setEditIncome(ingreso)
    setEditItem(null)
    setShowIncomeForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1)
    loadStats()
    setEditItem(null)
    setEditIncome(null)
    setShowIncomeForm(false)
  }

  const balance = stats.ingresos - stats.gastado

  const cards = [
    { label: 'Gastado', value: `$${stats.gastado.toFixed(2)}`, icon: HiArrowUp, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Ingresos', value: `$${stats.ingresos.toFixed(2)}`, icon: HiArrowDown, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Balance', value: `$${balance.toFixed(2)}`, icon: HiCreditCard, color: balance >= 0 ? 'text-green-500' : 'text-red-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Vencidos', value: stats.vencidos, icon: HiExclamation, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel Financiero</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Resumen del mes</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center`}>
              <c.icon className={`text-xl ${c.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.vencidos > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <HiExclamation className="text-2xl text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            Tenés {stats.vencidos} pago{stats.vencidos > 1 ? 's' : ''} vencido{stats.vencidos > 1 ? 's' : ''}. Regularizá cuanto antes.
          </p>
        </div>
      )}

      <PaymentForm onSuccess={handleSuccess} editItem={editItem} onCancelEdit={() => setEditItem(null)} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pagos</h2>
      </div>
      <PaymentList refreshKey={refreshKey} onEdit={handleEdit} />

      <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Ingresos</h2>
          <button onClick={() => { setShowIncomeForm(!showIncomeForm); setEditIncome(null) }}
            className="px-4 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium"
          >
            {showIncomeForm ? 'Cerrar' : 'Nuevo Ingreso'}
          </button>
        </div>

        {showIncomeForm && (
          <IncomeForm onSuccess={handleSuccess} editItem={editIncome} onCancelEdit={() => { setShowIncomeForm(false); setEditIncome(null) }} />
        )}

        <IncomeList refreshKey={refreshKey} onEdit={handleEditIncome} />
      </div>
    </div>
  )
}
