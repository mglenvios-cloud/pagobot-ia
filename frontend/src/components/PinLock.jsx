import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const N = [1,2,3,4,5,6,7,8,9,'',0,'⌫']

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [storedPin, setStoredPin] = useState(null)

  useEffect(() => {
    supabase.from('config').select('valor').eq('clave', 'pin').single().then(({ data }) => {
      setStoredPin(data?.valor || '')
    })
  }, [])

  const press = (v) => {
    if (v === '⌫') { setPin((p) => p.slice(0, -1)); return }
    if (pin.length >= 4) return
    setPin((p) => p + v)
  }

  useEffect(() => {
    if (pin.length === 4 && storedPin !== null) {
      if (pin === storedPin) {
        onUnlock()
      } else {
        setTimeout(() => setPin(''), 300)
      }
    }
  }, [pin, storedPin])

  if (storedPin === null) return null
  if (!storedPin) { onUnlock(); return null }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <p className="text-6xl mb-4">🤖</p>
        <h1 className="text-2xl font-bold text-white">PagoBot IA</h1>
        <p className="text-gray-400 text-sm mt-1">Ingresá tu PIN</p>
      </div>

      <div className="flex gap-3 mb-10">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all ${pin.length > i ? 'bg-blue-500 scale-110' : 'bg-gray-600'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-64">
        {N.map((v, i) => (
          v === '' ? <div key={i} /> :
          <button key={i} onClick={() => press(v)}
            className={`h-16 rounded-2xl text-xl font-bold transition-all active:scale-95 ${v === '⌫' ? 'text-gray-400 hover:bg-gray-800' : 'text-white bg-gray-800 hover:bg-gray-700'}`}
          >{v}</button>
        ))}
      </div>
    </div>
  )
}
