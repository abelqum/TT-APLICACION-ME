"use client";

import {
  Wallet,
  Receipt,
  Landmark,
  Clock3,
  FileClock,
  BadgeDollarSign,
} from "lucide-react";

function moneda(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor ?? 0));
}

export default function TarjetasResumenIngresos({ resumen, cargando }) {
  const grupos = [
    {
      titulo: "Resumen de las operaciones filtradas",
      tituloClases: "text-slate-500",

      tarjetas: [
        [
          "Total filtrado",
          resumen.total,
          Wallet,
          "text-emerald-700",
          "bg-emerald-50",
        ],
        ["Subtotal", resumen.subtotal, Receipt, "text-blue-700", "bg-blue-50"],
        [
          "I.V.A. incluido",
          resumen.iva,
          Landmark,
          "text-violet-700",
          "bg-violet-50",
        ],
      ],
    },
    {
      titulo: "Por cobrar (solo operaciones pendientes)",
      tituloClases: "text-orange-600",

      tarjetas: [
        [
          "Deuda total",
          resumen.pendiente,
          Clock3,
          "text-orange-700",
          "bg-orange-50",
        ],
        [
          "Subtotal pendiente",
          resumen.subtotalPendiente,
          FileClock,
          "text-orange-700",
          "bg-orange-50",
        ],
        [
          "I.V.A. pendiente",
          resumen.ivaPendiente,
          BadgeDollarSign,
          "text-orange-700",
          "bg-orange-50",
        ],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.titulo}>
          <h2
            className={`mb-3 text-xs font-black uppercase tracking-[0.12em] ${grupo.tituloClases}`}
          >
            {grupo.titulo}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {grupo.tarjetas.map(([titulo, importe, Icono, texto, fondo]) => (
              <article
                key={titulo}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className={`rounded-xl p-3 ${fondo} ${texto}`}>
                  <Icono size={22} />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wide ${grupo.tituloClases}`}
                  >
                    {titulo}
                  </p>

                  <p
                    className={`mt-1 break-words text-xl font-black ${
                      cargando ? "animate-pulse" : ""
                    } ${
                      grupo === grupos[1] ? "text-orange-700" : "text-slate-900"
                    }`}
                  >
                    {moneda(importe)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-slate-500">
        {resumen.cantidadRegistros ?? 0} operaciones coinciden con los filtros;{" "}
        {resumen.cantidadPendientes ?? 0} están pendientes. Los importes
        excluyen operaciones canceladas y abarcan todas las páginas.
      </p>
    </div>
  );
}
