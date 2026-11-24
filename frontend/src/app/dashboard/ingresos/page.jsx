"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  CircleDollarSign,
  Download,
  Eye,
  Pencil,
  Plus,
  Users,
} from "lucide-react";

import FiltrosIngresos, {
  FILTROS_INICIALES,
} from "@/componentes/ingresos/FiltrosIngresos";

import TarjetasResumenIngresos from "@/componentes/ingresos/TarjetasResumenIngresos";

import FormularioIngreso from "@/componentes/ingresos/FormularioIngreso";

import EditarIngresoModal from "@/componentes/ingresos/EditarIngresoModal";

import { servicioIngresos } from "@/servicios/servicioIngresos";

// ==========================================
// CONSTANTES
// ==========================================

const TAMANO = 20;

const RESUMEN_VACIO = {
  total: "0",
  subtotal: "0",
  iva: "0",

  pendiente: "0",
  subtotalPendiente: "0",
  ivaPendiente: "0",

  cantidadRegistros: 0,
  cantidadPendientes: 0,
};

function moneda(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor ?? 0));
}

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

export default function PaginaIngresos() {
  // Filtros e historial.

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const [pagina, setPagina] = useState(0);

  const [lista, setLista] = useState([]);

  const [totalPaginas, setTotalPaginas] = useState(0);

  const [totalRegistros, setTotalRegistros] = useState(0);

  const [resumen, setResumen] = useState(RESUMEN_VACIO);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  // Modales.

  const [modalAbierto, setModalAbierto] = useState(false);

  const [registroEditar, setRegistroEditar] = useState(null);

  const [cargandoEditor, setCargandoEditor] = useState(null);

  // Consultas y reportes.

  const [revision, setRevision] = useState(0);

  const [detalle, setDetalle] = useState(null);

  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [exportando, setExportando] = useState(false);

  // ==========================================
  // CONSULTAR HISTORIAL Y RESUMEN
  // ==========================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      try {
        const [paginaIngresos, resumenIngresos] = await Promise.all([
          servicioIngresos.listar({
            pagina,
            tamano: TAMANO,
            filtros,
            signal: controlador.signal,
          }),

          servicioIngresos.resumen({
            filtros,
            signal: controlador.signal,
          }),
        ]);

        if (controlador.signal.aborted) {
          return;
        }

        setLista(paginaIngresos.content ?? []);

        setTotalPaginas(paginaIngresos.totalPages ?? 0);

        setTotalRegistros(paginaIngresos.totalElements ?? 0);

        setResumen(resumenIngresos);

        setError("");
      } catch (excepcion) {
        if (controlador.signal.aborted) {
          return;
        }

        setError(excepcion.message || "No se pudieron consultar los ingresos.");

        setLista([]);
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      controlador.abort();
    };
  }, [filtros, pagina, revision]);

  // ==========================================
  // APLICAR FILTROS
  // ==========================================

  function aplicarFiltros(nuevos) {
    setPagina(0);
    setDetalle(null);
    setCargando(true);

    setFiltros(nuevos);

    setRevision((valor) => valor + 1);
  }

  function cambiarPagina(nueva) {
    setPagina(nueva);
    setCargando(true);
    setDetalle(null);
  }

  // ==========================================
  // INGRESO REGISTRADO O MODIFICADO
  // ==========================================

  function ingresoGuardado(resultado) {
    setModalAbierto(false);
    setRegistroEditar(null);

    setDetalle(resultado);

    setCargando(true);
    setPagina(0);

    setRevision((valor) => valor + 1);
  }

  // ==========================================
  // CONSULTAR DETALLE
  // ==========================================

  async function abrirDetalle(id) {
    setCargandoDetalle(true);
    setDetalle(null);

    try {
      const resultado = await servicioIngresos.consultar(id);

      setDetalle(resultado);
    } catch (excepcion) {
      setError(excepcion.message || "No se pudo consultar el ingreso.");
    } finally {
      setCargandoDetalle(false);
    }
  }

  // ==========================================
  // ABRIR EDITOR
  // ==========================================

  async function abrirEditor(id) {
    if (cargandoEditor !== null) {
      return;
    }

    setCargandoEditor(id);

    try {
      const registro = await servicioIngresos.consultar(id);

      if (
        registro.ingreso.estado === "CANCELADO" ||
        registro.ingreso.estadoIntegracionInventario === "APLICADO"
      ) {
        throw new Error(
          "Esta operación no puede editarse porque " +
            "está cancelada o ya impactó inventario.",
        );
      }

      setRegistroEditar(registro);
    } catch (excepcion) {
      const { default: Swal } = await import("sweetalert2");

      await Swal.fire({
        icon: "error",
        title: "No se pudo abrir el editor",
        text: excepcion.message,
      });
    } finally {
      setCargandoEditor(null);
    }
  }

  // ==========================================
  // EXPORTAR PDF
  // ==========================================

  async function exportarPDF() {
    if (exportando) {
      return;
    }

    setExportando(true);

    try {
      const datos = await servicioIngresos.reporte({
        filtros,
      });

      if (!datos.registros?.length) {
        const { default: Swal } = await import("sweetalert2");

        await Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No hay ingresos con estos filtros.",
        });

        return;
      }

      const { generarReporteIngresos } =
        await import("@/lib/reportes/reporteIngresos");

      generarReporteIngresos({
        registros: datos.registros,
        resumen: datos.resumen,
        filtros,
      });
    } catch (excepcion) {
      const { default: Swal } = await import("sweetalert2");

      await Swal.fire({
        icon: "error",
        title: "No se pudo generar el PDF",
        text: excepcion.message,
      });
    } finally {
      setExportando(false);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="mx-auto max-w-[95rem] space-y-7 pb-10">
      {/* ENCABEZADO */}

      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <CircleDollarSign size={27} className="text-blue-700" />
            Gestión de Ingresos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Historial, cobranza y reportes de las operaciones de tu empresa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/clientes"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Users size={18} />
            Clientes
          </Link>

          <button
            type="button"
            onClick={exportarPDF}
            disabled={exportando}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            <Download size={17} />

            {exportando ? "Generando..." : "Exportar PDF"}
          </button>

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-blue-800"
          >
            <Plus size={18} />
            Nuevo ingreso
          </button>
        </div>
      </header>

      {/* TARJETAS */}

      <TarjetasResumenIngresos resumen={resumen} cargando={cargando} />

      {/* FILTROS */}

      <FiltrosIngresos alAplicar={aplicarFiltros} />

      {/* HISTORIAL */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-800">Historial de ingresos</h2>

          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {totalRegistros} registros filtrados
          </span>
        </div>

        {/* ERRORES */}

        {error && (
          <div
            role="alert"
            className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            <button
              className="ml-3 underline"
              type="button"
              onClick={() => {
                setError("");
                setCargando(true);

                setRevision((valor) => valor + 1);
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* REGISTROS */}

        {cargando ? (
          <p className="p-12 text-center text-slate-500">
            Consultando registros y totales...
          </p>
        ) : lista.length === 0 ? (
          <p className="p-12 text-center text-slate-500">
            No se encontraron operaciones con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Folio</th>
                  <th className="p-4">Registro</th>
                  <th className="p-4">Cliente</th>

                  <th className="p-4 text-right">Subtotal</th>

                  <th className="p-4 text-right">IVA</th>

                  <th className="p-4 text-right">Total</th>

                  <th className="p-4">Estado</th>
                  <th className="p-4">Factura</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lista.map((ingreso) => {
                  const editable =
                    ingreso.estado !== "CANCELADO" &&
                    ingreso.estadoIntegracionInventario !== "APLICADO";

                  return (
                    <tr key={ingreso.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">
                        {ingreso.folio}
                      </td>

                      <td className="p-4 text-slate-600">
                        {ingreso.creadoEn
                          ? new Date(ingreso.creadoEn).toLocaleString("es-MX")
                          : ingreso.fecha}
                      </td>

                      <td className="p-4 text-slate-600">
                        {ingreso.clienteNombre}
                      </td>

                      <td className="p-4 text-right">
                        {moneda(ingreso.subtotal)}
                      </td>

                      <td className="p-4 text-right">{moneda(ingreso.iva)}</td>

                      <td className="p-4 text-right font-semibold">
                        {moneda(ingreso.total)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            ingreso.estado === "CANCELADO"
                              ? "bg-red-100 text-red-700"
                              : ingreso.estadoPago === "PAGADO"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {ingreso.estado === "CANCELADO"
                            ? "CANCELADO"
                            : ingreso.estadoPago}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600">
                        {ingreso.tieneFactura ? ingreso.numeroFactura : "No"}
                      </td>

                      {/* OJO Y LAPIZ */}

                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => abrirDetalle(ingreso.id)}
                            aria-label={`Ver ${ingreso.folio}`}
                            title="Ver detalle"
                            className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye size={19} />
                          </button>

                          <button
                            type="button"
                            disabled={!editable || cargandoEditor !== null}
                            onClick={() => abrirEditor(ingreso.id)}
                            aria-label={`Editar ${ingreso.folio}`}
                            title={
                              editable
                                ? "Editar ingreso"
                                : "Operación no editable"
                            }
                            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Pencil size={19} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACION */}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            disabled={cargando || pagina === 0}
            onClick={() => cambiarPagina(pagina - 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm text-slate-500">
            Página {totalPaginas ? pagina + 1 : 0} de {totalPaginas}
          </span>

          <button
            type="button"
            disabled={cargando || pagina + 1 >= totalPaginas}
            onClick={() => cambiarPagina(pagina + 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </section>

      {/* DETALLE */}

      {cargandoDetalle && (
        <p className="text-center text-sm text-slate-500">
          Consultando detalle...
        </p>
      )}

      {detalle && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Detalle · {detalle.ingreso.folio}
            </h2>

            <button
              type="button"
              onClick={() => setDetalle(null)}
              className="text-sm text-slate-500 underline"
            >
              Cerrar
            </button>
          </div>

          <p className="text-sm text-slate-600">
            Cliente: {detalle.ingreso.clienteNombre}
            {" · "}
            Estado:{" "}
            {detalle.ingreso.estado === "CANCELADO"
              ? "CANCELADO"
              : detalle.ingreso.estadoPago}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Precio</th>

                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {detalle.detalles.map((concepto) => (
                  <tr key={concepto.id}>
                    <td className="p-3">{concepto.concepto}</td>

                    <td className="p-3">{concepto.cantidad}</td>

                    <td className="p-3">{moneda(concepto.precioUnitario)}</td>

                    <td className="p-3 text-right">{moneda(concepto.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-right text-lg font-black">
            Total: {moneda(detalle.ingreso.total)}
          </p>
        </section>
      )}

      {/* NUEVO INGRESO */}

      {modalAbierto && (
        <FormularioIngreso
          alRegistrar={ingresoGuardado}
          alCancelar={() => setModalAbierto(false)}
        />
      )}

      {/* EDITAR INGRESO */}

      {registroEditar && (
        <EditarIngresoModal
          key={registroEditar.ingreso.id}
          registro={registroEditar}
          alGuardar={ingresoGuardado}
          alCerrar={() => setRegistroEditar(null)}
        />
      )}
    </div>
  );
}
