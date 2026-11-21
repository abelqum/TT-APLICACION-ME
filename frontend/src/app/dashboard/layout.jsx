"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import BarraLateral, {
  obtenerTituloRuta,
  rutaPermitida,
} from "@/componentes/dashboard/BarraLateral";

import EncabezadoDashboard from "@/componentes/dashboard/EncabezadoDashboard";

import { ProveedorSesionDashboard } from "@/contextos/ContextoSesionDashboard";

import { servicioAutenticacion } from "@/servicios/servicioAutenticacion";
import { ErrorApi } from "@/lib/api/clienteApi";
import { confirmarAccion, mostrarError } from "@/lib/alertas";
export default function LayoutDashboard({ children }) {
  const enrutador = useRouter();
  const rutaActual = usePathname();

  const [sesion, setSesion] = useState({
    usuario: null,
    cargando: true,
    error: "",
  });

  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();

    servicioAutenticacion
      .obtenerSesion({ signal: controlador.signal })
      .then((usuario) => {
        if (!controlador.signal.aborted) {
          setSesion({
            usuario,
            cargando: false,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (controlador.signal.aborted) return;

        if (
          error instanceof ErrorApi &&
          (error.estado === 401 || error.estado === 403)
        ) {
          enrutador.replace("/");
          return;
        }

        setSesion({
          usuario: null,
          cargando: false,
          error: error.message || "No fue posible comprobar la sesión.",
        });
      });

    return () => controlador.abort();
  }, [enrutador]);

  useEffect(() => {
    if (sesion.usuario && !rutaPermitida(rutaActual, sesion.usuario.rol)) {
      enrutador.replace("/dashboard");
    }
  }, [rutaActual, sesion.usuario, enrutador]);

  async function cerrarSesion() {
    const confirmado = await confirmarAccion({
      titulo: "¿Cerrar sesión?",
      texto:
        "Tendrás que volver a ingresar tus credenciales para acceder al sistema.",
      textoConfirmar: "Cerrar sesión",
      peligro: true,
    });

    if (!confirmado) return;

    try {
      await servicioAutenticacion.cerrarSesion();

      enrutador.replace("/");
      enrutador.refresh();
    } catch (error) {
      if (
        error instanceof ErrorApi &&
        (error.estado === 401 || error.estado === 403)
      ) {
        enrutador.replace("/");
        enrutador.refresh();
        return;
      }

      await mostrarError(
        "No se pudo cerrar la sesión",
        error.message || "Ocurrió un error al comunicarse con el servidor.",
      );
    }
  }

  if (sesion.cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Verificando sesión...
      </main>
    );
  }

  if (sesion.error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-5">
        <p className="text-red-700">{sesion.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-800 px-5 py-3 text-white"
        >
          Reintentar
        </button>
      </main>
    );
  }

  if (!sesion.usuario) return null;

  if (!rutaPermitida(rutaActual, sesion.usuario.rol)) {
    return null;
  }

  return (
    <ProveedorSesionDashboard
      valor={{
        usuario: sesion.usuario,
        empresa: sesion.usuario.empresa,
      }}
    >
      <div className="flex min-h-screen bg-slate-100">
        <BarraLateral
          rutaActual={rutaActual}
          usuario={sesion.usuario}
          abierta={menuAbierto}
          cerrarMenu={() => setMenuAbierto(false)}
          cerrarSesion={cerrarSesion}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <EncabezadoDashboard
            titulo={obtenerTituloRuta(rutaActual)}
            usuario={sesion.usuario}
            abrirMenu={() => setMenuAbierto(true)}
            cerrarSesion={cerrarSesion}
          />

          <main className="flex-1 p-4 md:p-7">{children}</main>
        </div>
      </div>
    </ProveedorSesionDashboard>
  );
}
