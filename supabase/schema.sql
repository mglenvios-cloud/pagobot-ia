-- Crear la tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  concepto TEXT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Otros',
  fecha_vencimiento DATE NOT NULL,
  es_recurrente BOOLEAN DEFAULT FALSE,
  pagado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_pagado ON pagos(pagado);
CREATE INDEX IF NOT EXISTS idx_pagos_categoria ON pagos(categoria);

-- Políticas de seguridad (Row Level Security)
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Permitir acceso anónimo (para desarrollo; en producción usar autenticación)
CREATE POLICY "Acceso anónimo a pagos"
  ON pagos
  FOR ALL
  USING (true)
  WITH CHECK (true);
