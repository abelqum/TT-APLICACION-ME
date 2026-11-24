"use client";

import { useEffect, useState } from "react";

import { RefreshCw, Search } from "lucide-react";

import { servicioClientes } from "@/servicios/servicioClientes";

export default function BuscadorClientes({
  valor = "",
  alCambiar,
  requerido = false,
  clienteInicial = null,
}) {
  const [texto, setTexto] = useState("");
  const [opciones, setOpciones] = useState([]);

  const [seleccionado, setSeleccionado] = useState(clienteInicial);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [actualizacion, setActualizacion] = useState(0);

  // ==========================================
  // BUSCAR EN EL SERVIDOR
  // ==========================================

  useEffect(() => {
    const controlador = new AbortController();

    const tarea = setTimeout(async () => {
      try {
        const pagina = await servicioClientes.listar({
          buscar: texto,
          pagina: 0,
          tamano: 30,
          signal: controlador.signal,
        });

        if (controlador.signal.aborted) {
          return;
        }

        setOpciones(pagina.content);
        setError("");
      } catch (excepcion) {
        if (controlador.signal.aborted) {
          return;
        }

        setError(excepcion.message || "No se pudieron consultar los clientes.");

        setOpciones([]);
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(tarea);
      controlador.abort();
    };
  }, [texto, actualizacion]);

  // Mantener visible el cliente seleccionado,
  // aunque no aparezca en los 30 resultados.

  const lista = [...opciones];

  if (
    seleccionado &&
    String(seleccionado.id) === String(valor) &&
    !lista.some((cliente) => String(cliente.id) === String(valor))
  ) {
    lista.unshift(seleccionado);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setCargando(true);
              setSeleccionado(null);

              alCambiar("", "");
            }}
            placeholder="Buscar cliente por nombre..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-600"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setCargando(true);

            setActualizacion((actual) => actual + 1);
          }}
          className="rounded-xl border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
          title="Actualizar clientes"
          aria-label="Actualizar clientes"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <select
        required={requerido}
        value={valor}
        onChange={(evento) => {
          const cliente = lista.find(
            (item) => String(item.id) === evento.target.value,
          );

          setSeleccionado(cliente ?? null);

          alCambiar(evento.target.value, cliente?.nombre || "");
        }}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800"
      >
        <option value="">
          {requerido ? "Seleccionar cliente..." : "Todos los clientes"}
        </option>

        {lista.map((cliente) => (
          <option value={cliente.id} key={cliente.id}>
            {cliente.nombre}

            {cliente.rfc ? ` (${cliente.rfc})` : ""}
          </option>
        ))}
      </select>

      {cargando && (
        <p className="text-xs text-slate-500">Buscando clientes...</p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}

      {!cargando && !error && lista.length === 0 && (
        <p className="text-xs text-slate-500">
          Sin coincidencias. Prueba otro nombre.
        </p>
      )}
    </div>
  );
}
