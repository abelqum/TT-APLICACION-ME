"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Search } from "lucide-react";

import { servicioClientes } from "@/servicios/servicioClientes";

import {
  mostrarMensajeGestion,
  obtenerMensajeErrorGestion,
} from "@/lib/alertas";

const formularioInicial = {
  nombre: "",
  rfc: "",
  correo: "",
  telefono: "",
};

export default function PaginaClientes() {
  const [formulario, setFormulario] = useState(formularioInicial);

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    async function cargarClientes() {
      try {
        const respuesta = await servicioClientes.listar({
          buscar: filtro,
          pagina,
          tamano: 20,
        });

        if (!vigente) return;

        const datos = respuesta?.datos ?? respuesta;

        setClientes(datos.content ?? []);
        setTotalPaginas(datos.totalPages ?? 0);
        setError("");
      } catch (excepcion) {
        if (!vigente) return;

        setError(obtenerMensajeErrorGestion(excepcion));
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    }

    cargarClientes();

    return () => {
      vigente = false;
    };
  }, [filtro, pagina, revision]);

  function cambiarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function registrarCliente(evento) {
    evento.preventDefault();

    if (guardando) return;

    setGuardando(true);

    try {
      await servicioClientes.registrar({
        nombre: formulario.nombre.trim(),
        rfc: formulario.rfc.trim() || null,
        correo: formulario.correo.trim() || null,
        telefono: formulario.telefono.trim() || null,
      });

      setFormulario(formularioInicial);

      setPagina(0);
      setRevision((actual) => actual + 1);

      await mostrarMensajeGestion(
        "Cliente registrado",
        "El cliente se guardó correctamente.",
      );
    } catch (excepcion) {
      await mostrarMensajeGestion(
        "No se pudo registrar",
        obtenerMensajeErrorGestion(excepcion),
        "error",
      );
    } finally {
      setGuardando(false);
    }
  }

  function buscarClientes(evento) {
    evento.preventDefault();

    setCargando(true);
    setPagina(0);
    setFiltro(busqueda.trim());
    setRevision((actual) => actual + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestión de Clientes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registra los clientes de tu empresa para seleccionarlos
            posteriormente en Ingresos.
          </p>
        </div>

        <Link
          href="/dashboard/ingresos"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Ir a Ingresos
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <UserPlus size={20} />
          Registrar cliente
        </h2>

        <form onSubmit={registrarCliente} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Nombre o razón social *
            </span>

            <input
              name="nombre"
              value={formulario.nombre}
              onChange={cambiarCampo}
              required
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
              placeholder="Ej. Taller Industrial del Norte"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">
              RFC (opcional)
            </span>

            <input
              name="rfc"
              value={formulario.rfc}
              onChange={cambiarCampo}
              minLength={12}
              maxLength={13}
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
              placeholder="RFC del cliente"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Correo electrónico
            </span>

            <input
              type="email"
              name="correo"
              value={formulario.correo}
              onChange={cambiarCampo}
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
              placeholder="cliente@ejemplo.com"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Teléfono</span>

            <input
              name="telefono"
              value={formulario.telefono}
              onChange={cambiarCampo}
              maxLength={30}
              className="w-full rounded-lg border border-slate-300 p-3 text-slate-900"
              placeholder="Número de contacto"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {guardando ? "Registrando..." : "Guardar cliente"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Users size={20} />
          Clientes registrados
        </h2>

        <form onSubmit={buscarClientes} className="mb-5 flex flex-wrap gap-2">
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3 text-sm text-slate-900"
          />

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            <Search size={17} />
            Buscar
          </button>
        </form>

        {cargando ? (
          <p className="py-8 text-center text-slate-500">
            Consultando clientes...
          </p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        ) : clientes.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            No se encontraron clientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">RFC</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Teléfono</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="p-3 font-medium text-slate-800">
                      {cliente.nombre}
                    </td>

                    <td className="p-3 text-slate-600">{cliente.rfc || "—"}</td>

                    <td className="p-3 text-slate-600">
                      {cliente.correo || "—"}
                    </td>

                    <td className="p-3 text-slate-600">
                      {cliente.telefono || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={pagina === 0 || cargando}
            onClick={() => {
              setCargando(true);
              setPagina((actual) => actual - 1);
            }}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm text-slate-500">
            Página {totalPaginas === 0 ? 0 : pagina + 1}
            {" de "}
            {totalPaginas}
          </span>

          <button
            type="button"
            disabled={cargando || pagina + 1 >= totalPaginas}
            onClick={() => {
              setCargando(true);
              setPagina((actual) => actual + 1);
            }}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}
