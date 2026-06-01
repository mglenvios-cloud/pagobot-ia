import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import { HiSearch, HiFilter } from 'react-icons/hi'

export default function Payments() {
  const [pagos, setPagos] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [category, setCategory] = useState('')

  useEffect(() => {
    supabase.from('pagos').select('*').order('fecha_vencimiento', { ascending: false }).then(({ data }) => setPagos(data || []))
  }, [])

  const filtered = pagos.filter((p) => {
    if (filter === 'pendientes' && p.pagado) return false
    if (filter === 'pagados' && !p.pagado) return false
    if (filter === 'vencidos' && (p.pagado || new Date(p.fecha_vencimiento) >= new Date())) return false
    if (search && !p.concepto.toLowerCase().includes(search.toLowerCase())) return false
    if (category && p.categoria !== category) return false
    return true
  })

  const categorias = [...new Set(pagos.map((p) => p.categoria))]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial de Pagos</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input sm:w-40">
          <option value="todos">Todos</option>
          <option value="pendientes">Pendientes</option>
          <option value="pagados">Pagados</option>
          <option value="vencidos">Vencidos</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-44">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-400">No se encontraron pagos</p>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Concepto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Categoría</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Vencimiento</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((p) => {
                  const vencido = !p.pagado && new Date(p.fecha_vencimiento) < new Date()
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium">{p.concepto}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.categoria}</td>
                      <td className="px-4 py-3 text-right font-semibold">${fmt(p.monto)}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.fecha_vencimiento}</td>
                      <td className="px-4 py-3 text-center">
                        {p.pagado ? <span className="badge-paid">Pagado</span> : vencido ? <span className="badge-overdue">Vencido</span> : <span className="badge-pending">Pendiente</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
