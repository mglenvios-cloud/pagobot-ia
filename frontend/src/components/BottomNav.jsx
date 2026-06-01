import { Link, useLocation } from 'react-router-dom'
import { HiHome, HiCreditCard, HiCalendar, HiChartBar, HiCog, HiDocument } from 'react-icons/hi'

const items = [
  { to: '/', icon: HiHome, label: 'Inicio' },
  { to: '/pagos', icon: HiCreditCard, label: 'Pagos' },
  { to: '/calendario', icon: HiCalendar, label: 'Calendario' },
  { to: '/reportes', icon: HiDocument, label: 'Reportes' },
  { to: '/analisis', icon: HiChartBar, label: 'IA' },
  { to: '/configuracion', icon: HiCog, label: 'Ajustes' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 transition-colors">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon className={`text-xl ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
