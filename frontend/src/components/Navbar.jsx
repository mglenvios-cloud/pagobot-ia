import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { HiSun, HiMoon } from 'react-icons/hi'

export default function Navbar() {
  const { pathname } = useLocation()
  const { dark, toggleDark } = useTheme()

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/pagos', label: 'Pagos' },
    { to: '/calendario', label: 'Calendario' },
    { to: '/analisis', label: 'Análisis IA' },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🤖</span>
          <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            PagoBot
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === to
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={toggleDark}
          className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? <HiSun className="text-lg" /> : <HiMoon className="text-lg" />}
        </button>
      </div>
    </nav>
  )
}
