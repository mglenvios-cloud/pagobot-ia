import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Payments from './pages/Payments'
import Calendar from './pages/Calendar'
import AIAnalysis from './pages/AIAnalysis'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pagos" element={<Payments />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/analisis" element={<AIAnalysis />} />
          <Route path="/configuracion" element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
