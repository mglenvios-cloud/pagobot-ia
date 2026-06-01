import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import PinLock from './components/PinLock'
import Home from './pages/Home'
import Payments from './pages/Payments'
import Calendar from './pages/Calendar'
import Goals from './pages/Goals'
import AIAnalysis from './pages/AIAnalysis'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [checkingPin, setCheckingPin] = useState(true)

  useEffect(() => {
    supabase.from('config').select('valor').eq('clave', 'pin').single().then(({ data }) => {
      if (!data?.valor) setUnlocked(true)
      setCheckingPin(false)
    })
  }, [])

  if (checkingPin) return null
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pagos" element={<Payments />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/objetivos" element={<Goals />} />
          <Route path="/reportes" element={<Reports />} />
          <Route path="/analisis" element={<AIAnalysis />} />
          <Route path="/configuracion" element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
