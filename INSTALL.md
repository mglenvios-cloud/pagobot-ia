# 🤖 PagoBot IA — Instalación

## Requisitos

- Node.js 18+
- Cuenta gratis en [Supabase](https://supabase.com)
- Cuenta gratis en [Vercel](https://vercel.com)
- WhatsApp (para el bot)

---

## 1. Clonar e instalar

```bash
cd pagobot-ia
npm install
```

## 2. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** → pegar el contenido de `supabase/schema.sql` → **Run**
3. Ir a **Settings → API** y copiar:
   - `Project URL` → VITE_SUPABASE_URL
   - `anon public key` → VITE_SUPABASE_ANON_KEY

## 3. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_WHATSAPP_NUMBER=5491123456789
```

## 4. Desarrollo local

```bash
npm run dev
```

Abrir http://localhost:5173

---

## 📱 WhatsApp Bot (opcional)

```bash
cd whatsapp-bot
npm install
npm run start
```

Escaneá el QR con WhatsApp para conectar el bot.
Los recordatorios se envían automáticamente a las 9 AM.

### Comandos del bot

- `hola` o `!pagos` — Ver próximos pagos
- `!ayuda` — Ayuda

---

## 🚀 Deploy en Vercel

### Opción 1: CLI

```bash
npm i -g vercel
vercel
```

### Opción 2: Git + Vercel

```bash
git init
git add .
git commit -m "PagoBot IA"
```

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio
3. Agregar variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
4. Deploy automático 🎉

---

## 📦 Estructura

```
pagobot-ia/
├── src/
│   ├── components/       # Componentes UI
│   │   ├── Navbar.jsx
│   │   ├── PaymentForm.jsx
│   │   ├── PaymentList.jsx
│   │   └── AIAnalysis.jsx
│   ├── pages/            # Páginas
│   │   ├── Home.jsx
│   │   ├── Payments.jsx
│   │   └── Settings.jsx
│   ├── lib/supabase.js   # Cliente Supabase
│   ├── App.jsx
│   └── main.jsx
├── supabase/schema.sql   # Base de datos
├── whatsapp-bot/         # Bot WhatsApp
├── vercel.json           # Config Vercel
└── .env.example
```

---

## 🧠 Funcionalidades IA

- Detecta si gastaste mucho en delivery este mes
- Recomienda cancelar suscripciones que no usás
- Alerta si un solo gasto supera el 30% del total mensual
- Análisis automático cada vez que cargás la página
