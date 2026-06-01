import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { HiShieldCheck, HiDatabase, HiPhone, HiSun, HiMoon, HiDownload, HiShare, HiPlus, HiTrash } from 'react-icons/hi'

export default function Settings() {
  const { dark, toggleDark } = useTheme()
  const [categorias, setCategorias] = useState([])
  const [newCat, setNewCat] = useState({ nombre: '', icono: '📦', tipo: 'gasto' })
  const [updating, setUpdating] = useState(false)

  const loadCats = async () => {
    const { data } = await supabase.from('categorias').select('*').order('id')
    if (data) setCategorias(data)
  }

  useEffect(() => { loadCats() }, [])

  const addCategoria = async () => {
    if (!newCat.nombre) return
    setUpdating(true)
    const { error } = await supabase.from('categorias').insert([{ nombre: newCat.nombre, icono: newCat.icono, tipo: newCat.tipo }])
    if (!error) { setNewCat({ nombre: '', icono: '📦', tipo: 'gasto' }); loadCats() }
    setUpdating(false)
  }

  const deleteCategoria = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categorias').delete().eq('id', id)
    loadCats()
  }

  const shareApp = async () => {
    const url = 'https://pagobot-ia.vercel.app'
    if (navigator.share) {
      await navigator.share({ title: 'PagoBot IA', text: 'Gestioná tus pagos con IA', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copiado al portapapeles')
    }
  }

  const iconos = ['📦', '💡', '🔄', '🏛️', '🍕', '🛒', '🚗', '💊', '🎬', '📚', '💰', '💻', '🎮', '👕', '✈️', '🎵', '🏋️', '🐱']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            {dark ? <HiSun className="text-xl text-blue-600" /> : <HiMoon className="text-xl text-blue-600" />}
          </div>
          <div>
            <h3 className="font-semibold">Modo Oscuro</h3>
            <p className="text-sm text-gray-500">Alternar tema claro/oscuro</p>
          </div>
        </div>
        <button onClick={toggleDark} className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Gestión de Categorías */}
      <div className="card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">📂 Categorías</h3>

        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm">
              <span>{c.icono} {c.nombre}</span>
              <button onClick={() => deleteCategoria(c.id)} className="ml-1 text-red-400 hover:text-red-600"><HiTrash className="text-sm" /></button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input value={newCat.nombre} onChange={(e) => setNewCat((c) => ({ ...c, nombre: e.target.value }))} placeholder="Nueva categoría" className="input flex-1" />
          <select value={newCat.icono} onChange={(e) => setNewCat((c) => ({ ...c, icono: e.target.value }))} className="input sm:w-20">
            {iconos.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={newCat.tipo} onChange={(e) => setNewCat((c) => ({ ...c, tipo: e.target.value }))} className="input sm:w-28">
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <button onClick={addCategoria} disabled={updating || !newCat.nombre} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50">
            <HiPlus className="text-lg" /> Agregar
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <HiDatabase className="text-xl text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">Supabase</h3>
            <p className="text-sm text-gray-500">Base de datos conectada</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-600 font-medium">Conectado</span>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <HiPhone className="text-xl text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">WhatsApp</h3>
            <p className="text-sm text-gray-500">Recordatorios automáticos a las 9 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-600 font-medium">Configurado</span>
          <span className="text-gray-400 ml-2">+54 9 11 6358-9041</span>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
            <HiShieldCheck className="text-xl text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold">IA de Análisis</h3>
            <p className="text-sm text-gray-500">Detección inteligente de gastos</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Analiza delivery, suscripciones, salidas, supermercado y transporte. Recomienda ahorro personalizado.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={shareApp} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all">
          <HiShare className="text-lg" /> Compartir App
        </button>
        <button onClick={() => window.open('https://github.com/mglenvios-cloud/pagobot-ia', '_blank')} className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
          <HiDownload className="text-lg" /> Código
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">PagoBot IA v2.0 — Hecho con 🤖</p>
    </div>
  )
}
