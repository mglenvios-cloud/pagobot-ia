import { Link, useLocation } from 'react-router-dom'
import { HiHome, HiCreditCard, HiCog } from 'react-icons/hi'

const links = [
  { to: '/', label: 'Inicio', icon: HiHome },
  { to: '/pagos', label: 'Pagos', icon: HiCreditCard },
  { to: '/configuracion', label: 'Config', icon: HiCog },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="font-bold text-xl text-gray-800">PagoBot IA</span>
          </Link>
          <div className="flex gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="text-lg" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
