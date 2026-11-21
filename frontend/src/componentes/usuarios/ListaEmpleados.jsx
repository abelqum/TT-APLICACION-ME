"use client";

import { useEffect, useState } from "react";

import { Users, Search, RefreshCw, AlertCircle } from "lucide-react";

import { servicioUsuarios } from "@/servicios/servicioUsuarios";

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function cargarEmpleados() {
      try {
        const respuesta = await servicioUsuarios.listarEmpleados();

        if (!vigente) return;

        const lista = Array.isArray(respuesta) ? respuesta : respuesta?.datos;

        if (!Array.isArray(lista)) {
          throw new Error("La API no devolvió una lista de empleados.");
        }

        setEmpleados(lista);
        setError("");
      } catch (err) {
        if (!vigente) return;

        setError(err.message || "No se pudieron consultar los empleados.");
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    }

    cargarEmpleados();

    return () => {
      vigente = false;
    };
  }, [revision]);

  function actualizarLista() {
    setCargando(true);
    setError("");
    setRevision((actual) => actual + 1);
  }

  const empleadosFiltrados = empleados.filter((empleado) => {
    const texto = busqueda.trim().toLowerCase();

    return (
      empleado.nombre.toLowerCase().includes(texto) ||
      empleado.correo.toLowerCase().includes(texto)
    );
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Users size={20} className="text-blue-700" />
              Empleados registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulta los empleados de tu empresa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
              {empleados.length} empleados
            </span>

            <button
              type="button"
              onClick={actualizarLista}
              disabled={cargando}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              title="Actualizar empleados"
              aria-label="Actualizar empleados"
            >
              <RefreshCw size={19} className={cargando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {cargando ? (
        <div className="p-12 text-center text-sm text-slate-500">
          Cargando empleados...
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-6 text-red-700">
          <AlertCircle size={21} className="shrink-0" />
          <div>
            <p className="font-semibold">No se pudo cargar la lista.</p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={actualizarLista}
              className="mt-3 text-sm font-semibold underline"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      ) : empleadosFiltrados.length === 0 ? (
        <div className="p-12 text-center">
          <Users size={35} className="mx-auto text-slate-300" />

          <p className="mt-3 font-semibold text-slate-700">
            {empleados.length === 0
              ? "Todavía no hay empleados registrados."
              : "No hay empleados que coincidan con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Nombre</th>
                <th className="px-5 py-4">Correo</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {empleado.nombre}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {empleado.correo}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {empleado.rol}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        empleado.activo
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                          : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      }
                    >
                      {empleado.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
