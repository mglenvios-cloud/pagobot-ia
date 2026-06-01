-- PagoBot IA - Esquema Completo de Base de Datos
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- TABLAS
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  icono TEXT DEFAULT '📦',
  tipo TEXT NOT NULL DEFAULT 'gasto' CHECK (tipo IN ('gasto', 'ingreso')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categorias (nombre, icono, tipo) VALUES
  ('Servicios', '💡', 'gasto'),
  ('Suscripciones', '🔄', 'gasto'),
  ('Impuestos', '🏛️', 'gasto'),
  ('Delivery', '🍕', 'gasto'),
  ('Supermercado', '🛒', 'gasto'),
  ('Transporte', '🚗', 'gasto'),
  ('Salud', '💊', 'gasto'),
  ('Entretenimiento', '🎬', 'gasto'),
  ('Educacion', '📚', 'gasto'),
  ('Otros Gastos', '📦', 'gasto'),
  ('Salario', '💰', 'ingreso'),
  ('Freelance', '💻', 'ingreso')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000',
  concepto TEXT NOT NULL,
  monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
  categoria_id BIGINT REFERENCES categorias(id),
  categoria TEXT NOT NULL DEFAULT 'Otros',
  fecha_vencimiento DATE NOT NULL,
  es_recurrente BOOLEAN DEFAULT FALSE,
  recurrencia_tipo TEXT DEFAULT 'mensual' CHECK (recurrencia_tipo IN ('diario', 'semanal', 'mensual', 'anual')),
  pagado BOOLEAN DEFAULT FALSE,
  fecha_pago DATE,
  metodo_pago TEXT DEFAULT 'debito_automatico' CHECK (metodo_pago IN ('debito_automatico', 'transferencia', 'efectivo', 'tarjeta', 'otro')),
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  notificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingresos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000',
  concepto TEXT NOT NULL,
  monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
  categoria_id BIGINT REFERENCES categorias(id),
  fecha DATE NOT NULL,
  es_recurrente BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_pagado ON pagos(pagado);
CREATE INDEX IF NOT EXISTS idx_pagos_categoria ON pagos(categoria);
CREATE INDEX IF NOT EXISTS idx_pagos_recurrente ON pagos(es_recurrente);
CREATE INDEX IF NOT EXISTS idx_ingresos_usuario ON ingresos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);

-- ============================================
-- FUNCIONES
-- ============================================

CREATE OR REPLACE FUNCTION generar_pagos_recurrentes()
RETURNS void AS $$
BEGIN
  INSERT INTO pagos (usuario_id, concepto, monto, categoria_id, categoria, fecha_vencimiento, es_recurrente, recurrencia_tipo, metodo_pago)
  SELECT
    p.usuario_id, p.concepto, p.monto, p.categoria_id, p.categoria,
    CASE
      WHEN p.recurrencia_tipo = 'mensual' THEN (p.fecha_vencimiento + INTERVAL '1 month')::date
      WHEN p.recurrencia_tipo = 'anual' THEN (p.fecha_vencimiento + INTERVAL '1 year')::date
      WHEN p.recurrencia_tipo = 'semanal' THEN (p.fecha_vencimiento + INTERVAL '1 week')::date
      ELSE (p.fecha_vencimiento + INTERVAL '1 month')::date
    END,
    TRUE, p.recurrencia_tipo, p.metodo_pago
  FROM pagos p
  WHERE p.es_recurrente = TRUE
    AND p.fecha_vencimiento < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM pagos p2
      WHERE p2.concepto = p.concepto
        AND p2.usuario_id = p.usuario_id
        AND p2.fecha_vencimiento > p.fecha_vencimiento
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEGURIDAD RLS
-- ============================================

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso anonimo pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso anonimo ingresos" ON ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso anonimo categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
