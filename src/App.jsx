import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Payments from './pages/Payments'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pagos" element={<Payments />} />
          <Route path="/configuracion" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
