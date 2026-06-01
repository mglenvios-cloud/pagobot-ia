const API = 'https://pagobot-backend.vercel.app/api'

export async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
