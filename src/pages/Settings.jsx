import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { HiShieldCheck, HiDatabase, HiPhone } from 'react-icons/hi'

export default function Settings() {
  const [status, setStatus] = useState(null)

  const testConnection = async () => {
    const { error } = await supabase.from('pagos').select('count', { count: 'exact', head: true })
    setStatus(error ? '❌ Error de conexión: ' + error.message : '✅ Conexión exitosa')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <HiDatabase className="text-xl text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Conexión Supabase</h3>
            <p className="text-sm text-gray-500">Verificá que la base de datos esté funcionando</p>
          </div>
        </div>
        <button
          onClick={testConnection}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Probar Conexión
        </button>
        {status && <p className="text-sm">{status}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <HiPhone className="text-xl text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">WhatsApp</h3>
            <p className="text-sm text-gray-500">Los recordatorios se envían vía WhatsApp Web</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Configurá tu número en la variable <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">VITE_WHATSAPP_NUMBER</code> del archivo <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600">.env</code>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <HiShieldCheck className="text-xl text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">IA de Análisis</h3>
            <p className="text-sm text-gray-500">El análisis de gastos es automático</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          La IA detecta gastos altos por categoría (delivery, suscripciones, salidas) y recomienda
          ahorro. No necesita configuración adicional.
        </p>
      </div>
    </div>
  )
}
