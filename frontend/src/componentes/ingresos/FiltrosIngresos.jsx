"use client";

import { useState } from "react";

import { Filter, RotateCcw, Search } from "lucide-react";

import BuscadorClientes from "@/componentes/ingresos/BuscadorClientes";

export const FILTROS_INICIALES = {
  buscar: "",
  clienteId: "",
  clienteNombre: "",
  estado: "",
  fechaReferencia: "REGISTRO",
  anio: "",
  mes: "",
  fechaDesde: "",
  fechaHasta: "",
};

const ANIO_ACTUAL = new Date().getFullYear();

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function FiltrosIngresos({ alAplicar }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const anios = Array.from(
    { length: 12 },
    (_, indice) => ANIO_ACTUAL + 1 - indice,
  );

  function cambiar(nombre, valor) {
    setFiltros((actual) => ({
      ...actual,
      [nombre]: valor,
    }));
  }

  function aplicar(evento) {
    evento.preventDefault();

    if (
      filtros.fechaDesde &&
      filtros.fechaHasta &&
      filtros.fechaDesde > filtros.fechaHasta
    ) {
      alert("La fecha inicial no puede ser posterior a la fecha final.");

      return;
    }

    alAplicar({
      ...filtros,
      buscar: filtros.buscar.trim(),
    });
  }

  function limpiar() {
    setFiltros({
      ...FILTROS_INICIALES,
    });

    alAplicar({
      ...FILTROS_INICIALES,
    });
  }

  const campo =
    "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-600";

  const etiqueta =
    "mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500";

  return (
    <form
      onSubmit={aplicar}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2 font-bold text-slate-800">
        <Filter size={18} className="text-blue-700" />
        Filtros del historial
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* BUSQUEDA */}

        <label className="block xl:col-span-2">
          <span className={etiqueta}>Buscar por cliente o folio</span>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={filtros.buscar}
              onChange={(evento) => cambiar("buscar", evento.target.value)}
              placeholder="Ej. ING-00000001 o razón social..."
              className={`${campo} pl-10`}
            />
          </div>
        </label>

        {/* CLIENTE */}

        <div className="xl:col-span-2">
          <span className={etiqueta}>Cliente específico</span>

          <BuscadorClientes
            valor={filtros.clienteId}
            alCambiar={(id, nombre) => {
              setFiltros((actual) => ({
                ...actual,
                clienteId: id,
                clienteNombre: nombre,
              }));
            }}
          />
        </div>

        {/* ESTADO */}

        <label className="block">
          <span className={etiqueta}>Estado de pago</span>

          <select
            value={filtros.estado}
            onChange={(evento) => cambiar("estado", evento.target.value)}
            className={campo}
          >
            <option value="">Todos</option>
            <option value="PAGADO">Pagadas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="CANCELADO">Canceladas</option>
          </select>
        </label>

        {/* FECHA DE REFERENCIA */}

        <label className="block">
          <span className={etiqueta}>Filtrar fechas por</span>

          <select
            value={filtros.fechaReferencia}
            onChange={(evento) =>
              cambiar("fechaReferencia", evento.target.value)
            }
            className={campo}
          >
            <option value="REGISTRO">Registro (creación)</option>

            <option value="OPERACION">Operación / factura</option>

            <option value="PAGO">Fecha de pago</option>
          </select>
        </label>

        {/* ANIO */}

        <label className="block">
          <span className={etiqueta}>Año</span>

          <select
            value={filtros.anio}
            onChange={(evento) => {
              setFiltros((actual) => ({
                ...actual,
                anio: evento.target.value,

                mes: evento.target.value ? actual.mes : "",
              }));
            }}
            className={campo}
          >
            <option value="">Todos los años</option>

            {anios.map((anio) => (
              <option value={anio} key={anio}>
                {anio}
              </option>
            ))}
          </select>
        </label>

        {/* MES */}

        <label className="block">
          <span className={etiqueta}>Mes</span>

          <select
            value={filtros.mes}
            disabled={!filtros.anio}
            onChange={(evento) => cambiar("mes", evento.target.value)}
            className={`${campo} disabled:opacity-50`}
          >
            <option value="">Todos los meses</option>

            {MESES.map((mes, indice) => (
              <option key={mes} value={indice + 1}>
                {mes}
              </option>
            ))}
          </select>
        </label>

        {/* RANGO DE FECHAS */}

        <label className="block">
          <span className={etiqueta}>Desde (opcional)</span>

          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(evento) => cambiar("fechaDesde", evento.target.value)}
            className={campo}
          />
        </label>

        <label className="block">
          <span className={etiqueta}>Hasta (opcional)</span>

          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(evento) => cambiar("fechaHasta", evento.target.value)}
            className={campo}
          />
        </label>
      </div>

      {/* ACCIONES */}

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={limpiar}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Limpiar
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-bold uppercase text-white hover:bg-blue-800"
        >
          <Search size={16} />
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
