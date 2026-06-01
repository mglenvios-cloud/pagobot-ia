# 🤖 PagoBot IA — Instalación v2

## Requisitos

- Node.js 18+
- Cuenta [Supabase](https://supabase.com)
- Cuenta [Vercel](https://vercel.com) (opcional para deploy)

---

## 1. Clonar e instalar

```bash
git clone https://github.com/mglenvios-cloud/pagobot-ia
cd pagobot-ia

# Instalar frontend y backend
cd frontend && npm install
cd ../backend && npm install
```

## 2. Base de datos (Supabase)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. **SQL Editor** → pegar `database/schema.sql` → **Run**
3. **Settings → API** → copiar `Project URL` y `anon public key`

## 3. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_WHATSAPP_NUMBER=5491123456789
```

## 4. Iniciar frontend

```bash
cd frontend
npm run dev
# http://localhost:5173
```

## 5. Iniciar backend (opcional, para WhatsApp)

```bash
cd backend
npm run dev
# http://localhost:3000
```

El frontend ya funciona sin backend gracias a Supabase.

---

## 📱 WhatsApp Bot

```bash
cd backend
npm run dev
```

Al iniciar, escaneá el QR con WhatsApp.
Los recordatorios automáticos se envían a las 9 AM.

---

## 🚀 Deploy en Vercel

```bash
# Desde la raíz del proyecto
vercel --prod
```

O conectá el repo desde https://vercel.com/new

Agregar variables de entorno en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER`

---

## 📁 Estructura

```
pagobot-ia/
├── frontend/              # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/    # Navbar, BottomNav, PaymentForm, PaymentList
│   │   ├── pages/         # Home, Payments, Calendar, AIAnalysis, Settings
│   │   ├── context/       # ThemeContext (dark mode)
│   │   └── lib/           # Supabase client, API helper
│   └── ...
├── backend/               # Node.js + Express
│   ├── src/
│   │   ├── routes/        # payments, analysis, whatsapp
│   │   ├── whatsapp/      # Baileys bot
│   │   └── cron/          # Recordatorios automáticos
│   └── ...
├── database/
│   └── schema.sql         # Tablas: usuarios, pagos, ingresos, categorias
├── .env.example
├── vercel.json            # Config para deploy
└── INSTALL.md
```
