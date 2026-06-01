const metodoLabels = {
  debito_automatico: 'Débito Automático',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

export async function generarPDF({ titulo, periodo, totalIngresos, totalGastos, balance, items }) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(22)
  doc.setTextColor(37, 99, 235)
  doc.text('PagoBot IA', 14, 20)

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(titulo, 14, 30)

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Período: ${periodo}`, 14, 37)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Resumen', 14, 48)

  doc.setFontSize(10)
  doc.text(`Total Ingresos: +$${totalIngresos.toFixed(2)}`, 14, 56)
  doc.text(`Total Gastos: -$${totalGastos.toFixed(2)}`, 14, 63)
  doc.text(`Balance: $${balance.toFixed(2)}`, 14, 70)
  if (totalIngresos > 0) {
    doc.text(`Relación Gasto/Ingreso: ${((totalGastos / totalIngresos) * 100).toFixed(1)}%`, 14, 77)
  }

  const startY = 88
  const headers = items.length > 0 && items[0].type === 'income'
    ? [['Fecha', 'Concepto', 'Categoría', 'Método', 'Monto']]
    : [['Fecha', 'Concepto', 'Categoría', 'Método', 'Estado', 'Monto']]

  const body = items.map((item) => {
    if (item.type === 'income') {
      return [
        item.fecha,
        item.concepto,
        item.categoria || '-',
        metodoLabels[item.metodo_pago] || item.metodo_pago || '-',
        { content: `+$${parseFloat(item.monto).toFixed(2)}`, styles: { textColor: [22, 163, 74] } },
      ]
    }
    const estado = item.pagado ? 'Pagado' : 'Pendiente'
    return [
      item.fecha_vencimiento,
      item.concepto,
      item.categoria,
      metodoLabels[item.metodo_pago] || item.metodo_pago || '-',
      estado,
      { content: `-$${parseFloat(item.monto).toFixed(2)}`, styles: { textColor: [220, 38, 38] } },
    ]
  })

  doc.autoTable({
    startY,
    head: headers,
    body,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { top: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`Generado por PagoBot IA - ${new Date().toLocaleDateString('es-AR')}`, 14, doc.internal.pageSize.getHeight() - 10)
    },
  })

  const filename = `reporte-${periodo.replace(/[/\s]/g, '-')}.pdf`
  doc.save(filename)
}

export function printReport({ titulo, items }) {
  const win = window.open('', '_blank')
  const rows = items.map((item) => {
    if (item.type === 'income') {
      return `<tr>
        <td>${item.fecha}</td>
        <td>${item.concepto}</td>
        <td>${item.categoria || '-'}</td>
        <td>${metodoLabels[item.metodo_pago] || item.metodo_pago || '-'}</td>
        <td style="color:#16a34a;font-weight:bold">+$${parseFloat(item.monto).toFixed(2)}</td>
      </tr>`
    }
    const estado = item.pagado ? '✅ Pagado' : '⏳ Pendiente'
    return `<tr>
      <td>${item.fecha_vencimiento}</td>
      <td>${item.concepto}</td>
      <td>${item.categoria}</td>
      <td>${metodoLabels[item.metodo_pago] || item.metodo_pago || '-'}</td>
      <td>${estado}</td>
      <td style="color:#dc2626;font-weight:bold">-$${parseFloat(item.monto).toFixed(2)}</td>
    </tr>`
  }).join('')

  win.document.write(`
    <html><head><title>${titulo}</title>
    <style>
      body { font-family: Inter, sans-serif; padding: 20px; color: #1f2937; }
      h1 { font-size: 24px; color: #2563eb; margin-bottom: 4px; }
      h2 { font-size: 14px; color: #6b7280; font-weight: 400; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
      th { background: #2563eb; color: #fff; padding: 8px 12px; text-align: left; }
      td { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) { background: #eff6ff; }
      .footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 20px; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <h1>PagoBot IA</h1>
      <h2>${titulo}</h2>
      <table><thead><tr>
        <th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Método</th>${items[0]?.type !== 'income' ? '<th>Estado</th>' : ''}<th>Monto</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">Generado por PagoBot IA - ${new Date().toLocaleDateString('es-AR')}</div>
      <script>window.print(); window.close();</script>
    </body></html>
  `)
  win.document.close()
}
