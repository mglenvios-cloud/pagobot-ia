import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { HiSearch } from 'react-icons/hi'

export default function Payments() {
  const [pagos, setPagos] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')

  useEffect(() => {
    supabase
      .from('pagos')
      .select('*')
      .order('fecha_vencimiento', { ascending: false })
      .then(({ data }) => setPagos(data || []))
  }, [])

  const filtered = pagos.filter((p) => {
    if (filter === 'pendientes' && p.pagado) return false
    if (filter === 'pagados' && !p.pagado) return false
    if (search && !p.concepto.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Historial de Pagos</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="todos">Todos</option>
          <option value="pendientes">Pendientes</option>
          <option value="pagados">Pagados</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No se encontraron pagos</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Concepto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.concepto}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoria}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">${p.monto}</td>
                  <td className="px-4 py-3 text-gray-500">{p.fecha_vencimiento}</td>
                  <td className="px-4 py-3">
                    {p.pagado ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Pagado</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
