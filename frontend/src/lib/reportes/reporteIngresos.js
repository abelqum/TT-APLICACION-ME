import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// FORMATO MONETARIO
// ==========================================

function moneda(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor ?? 0));
}

// ==========================================
// FORMATO DE FECHAS
// ==========================================

function fecha(valor) {
  if (!valor) {
    return "-";
  }

  const iso = String(valor).slice(0, 10);

  const [anio, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${anio}`;
}

// ==========================================
// DESCRIBIR LOS FILTROS APLICADOS
// ==========================================

function describir(filtros) {
  const lista = [];

  if (filtros.buscar) {
    lista.push(`Búsqueda: ${filtros.buscar}`);
  }

  if (filtros.clienteId) {
    lista.push(`Cliente: ${filtros.clienteNombre || `#${filtros.clienteId}`}`);
  }

  if (filtros.estado) {
    lista.push(`Estado: ${filtros.estado}`);
  }

  if (filtros.anio) {
    lista.push(`Año: ${filtros.anio}`);
  }

  if (filtros.mes) {
    lista.push(`Mes: ${filtros.mes}`);
  }

  if (filtros.fechaDesde) {
    lista.push(`Desde: ${filtros.fechaDesde}`);
  }

  if (filtros.fechaHasta) {
    lista.push(`Hasta: ${filtros.fechaHasta}`);
  }

  const referencias = {
    REGISTRO: "Registro",
    OPERACION: "Operación / factura",
    PAGO: "Pago",
  };

  lista.push(
    `Referencia de fechas: ${
      referencias[filtros.fechaReferencia] || "Registro"
    }`,
  );

  return lista;
}

// ==========================================
// GENERAR REPORTE
// ==========================================

export function generarReporteIngresos({ registros, resumen, filtros }) {
  // ========================================
  // CREAR DOCUMENTO
  // ========================================

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "letter",
  });

  const ancho = pdf.internal.pageSize.getWidth();

  const alto = pdf.internal.pageSize.getHeight();

  // ========================================
  // ENCABEZADO AZUL
  // ========================================

  pdf.setFillColor(20, 41, 91);

  pdf.rect(0, 0, ancho, 29, "F");

  pdf.setTextColor(255, 255, 255);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(17);

  pdf.text("Reporte de ingresos", 12, 12);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(9);

  pdf.text("Sistema de Gestión para Microempresas", 12, 19);

  pdf.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 12, 25);

  // ========================================
  // TITULO DEL RESUMEN
  // ========================================

  pdf.setTextColor(30, 41, 59);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(11);

  pdf.text("Resumen de los filtros aplicados", 12, 37);

  // ========================================
  // TABLA DE RESUMEN
  // ========================================

  autoTable(pdf, {
    startY: 41,

    theme: "grid",

    head: [
      [
        "Total",
        "Subtotal",
        "IVA",
        "Por cobrar",
        "Base pendiente",
        "IVA pendiente",
      ],
    ],

    body: [
      [
        moneda(resumen.total),
        moneda(resumen.subtotal),
        moneda(resumen.iva),
        moneda(resumen.pendiente),
        moneda(resumen.subtotalPendiente),
        moneda(resumen.ivaPendiente),
      ],
    ],

    headStyles: {
      fillColor: [29, 78, 216],
    },

    styles: {
      fontSize: 8,
    },

    margin: {
      left: 12,
      right: 12,
    },
  });

  // ========================================
  // DESCRIPCION DE FILTROS
  // ========================================

  let posicionY = pdf.lastAutoTable.finalY + 8;

  const descripcion = describir(filtros);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9);

  pdf.text("Filtros:", 12, posicionY);

  pdf.setFont("helvetica", "normal");

  const textoFiltros = descripcion.join(" | ");

  const lineas = pdf.splitTextToSize(textoFiltros, ancho - 28);

  pdf.text(lineas, 12, posicionY + 5);

  posicionY += 6 + lineas.length * 4.5;

  // ========================================
  // TABLA DE INGRESOS
  // ========================================

  autoTable(pdf, {
    startY: posicionY,

    theme: "striped",

    head: [
      [
        "Folio",
        "Cliente",
        "Registro",
        "Operación",
        "Fecha pago",
        "Subtotal",
        "IVA",
        "Total",
        "Estado",
        "Factura",
      ],
    ],

    body: registros.map((ingreso) => [
      ingreso.folio ?? "-",

      ingreso.clienteNombre ?? "Público en general",

      fecha(ingreso.creadoEn),

      fecha(ingreso.fecha),

      fecha(ingreso.fechaPago),

      moneda(ingreso.subtotal),

      moneda(ingreso.iva),

      moneda(ingreso.total),

      ingreso.estado === "CANCELADO" ? "Cancelado" : ingreso.estadoPago,

      ingreso.tieneFactura ? ingreso.numeroFactura || "Sí" : "No",
    ]),

    margin: {
      left: 12,
      right: 12,
      top: 14,
      bottom: 15,
    },

    headStyles: {
      fillColor: [30, 41, 59],
      fontSize: 7,
    },

    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
    },

    columnStyles: {
      1: {
        cellWidth: 39,
      },
    },
  });

  // ========================================
  // NUMERACION DE PAGINAS
  // ========================================

  const paginas = pdf.internal.getNumberOfPages();

  for (let numero = 1; numero <= paginas; numero++) {
    pdf.setPage(numero);

    pdf.setTextColor(100, 116, 139);

    pdf.setFontSize(8);

    pdf.text(`Página ${numero} / ${paginas}`, ancho - 12, alto - 7, {
      align: "right",
    });
  }

  // ========================================
  // DESCARGAR
  // ========================================

  const fechaActual = new Date().toISOString().slice(0, 10);

  pdf.save(`ingresos_filtrados_${fechaActual}.pdf`);
}
