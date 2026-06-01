import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PaymentForm from '../components/PaymentForm'
import PaymentList from '../components/PaymentList'
import AIAnalysis from '../components/AIAnalysis'
import { HiTrendingUp } from 'react-icons/hi'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({ total: 0, pendientes: 0, pagados: 0 })

  const loadStats = async () => {
    const { data } = await supabase.from('pagos').select('*')
    if (data) {
      setStats({
        total: data.reduce((a, p) => a + p.monto, 0),
        pendientes: data.filter((p) => !p.pagado).length,
        pagados: data.filter((p) => p.pagado).length,
      })
    }
  }

  useEffect(() => { loadStats() }, [refreshKey])

  const cards = [
    { label: 'Total Gastado', value: `$${stats.total.toFixed(2)}`, color: 'bg-blue-500' },
    { label: 'Pagos Pendientes', value: stats.pendientes, color: 'bg-yellow-500' },
    { label: 'Pagos Realizados', value: stats.pagados, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <AIAnalysis />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentForm onPaymentAdded={() => { setRefreshKey((k) => k + 1); loadStats() }} />
        <PaymentList key={refreshKey} />
      </div>
    </div>
  )
}
