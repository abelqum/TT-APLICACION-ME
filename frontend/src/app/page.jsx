"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

import CampoContrasena from "@/componentes/formularios/CampoContrasena";
import { servicioAutenticacion } from "@/servicios/servicioAutenticacion";
import { ErrorApi } from "@/lib/api/clienteApi";

import { mostrarAdvertencia, mostrarError, mostrarExito } from "@/lib/alertas";

export default function PaginaInicioSesion() {
  const enrutador = useRouter();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const controlador = new AbortController();

    servicioAutenticacion
      .obtenerSesion({
        signal: controlador.signal,
      })
      .then(() => {
        if (!controlador.signal.aborted) {
          enrutador.replace("/dashboard");
        }
      })
      .catch(() => {
        if (!controlador.signal.aborted) {
          setVerificando(false);
        }
      });

    return () => controlador.abort();
  }, [enrutador]);

  async function iniciarSesion(evento) {
    evento.preventDefault();

    if (!correo.trim() || !contrasena) {
      await mostrarAdvertencia(
        "Datos incompletos",
        "Ingresa tu correo electrónico y contraseña.",
      );
      return;
    }

    setCargando(true);

    try {
      await servicioAutenticacion.iniciarSesion(
        correo.trim().toLowerCase(),
        contrasena,
      );

      await mostrarExito("Sesión iniciada", "Bienvenido al sistema.");

      enrutador.replace("/dashboard");
      enrutador.refresh();
    } catch (error) {
      const mensaje =
        error instanceof ErrorApi &&
        (error.estado === 400 || error.estado === 401)
          ? "Correo o contraseña incorrectos."
          : error.message || "No fue posible comunicarse con el servidor.";

      await mostrarError("No se pudo iniciar sesión", mensaje);
    } finally {
      setCargando(false);
    }
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Verificando sesión...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="bg-brand-950 px-8 py-9 text-center">
          <h1 className="text-3xl font-black text-white">Sistema de Gestión</h1>
          <p className="mt-2 text-sm text-blue-100">
            Administración para microempresas
          </p>
        </header>

        <form onSubmit={iniciarSesion} noValidate className="space-y-5 p-8">
          <h2 className="text-center text-xl font-bold text-slate-900">
            Iniciar sesión
          </h2>

          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-xs font-bold uppercase text-slate-600"
            >
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              autoComplete="email"
              maxLength={200}
              disabled={cargando}
              required
              className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-700"
            />
          </div>

          <CampoContrasena
            id="contrasena"
            valor={contrasena}
            alCambiar={setContrasena}
            deshabilitado={cargando}
          />

          <button
            type="submit"
            disabled={cargando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 p-3 font-bold text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            <LogIn size={19} />
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <div className="border-t border-slate-200 pt-5 text-center text-sm">
            <p className="text-slate-500">
              ¿Aún no tienes una empresa registrada?
            </p>

            <Link
              href="/registro"
              className="font-bold text-blue-700 hover:underline"
            >
              Crear empresa
            </Link>
          </div>
        </form>

        <footer className="border-t bg-slate-50 p-4 text-center text-xs text-slate-500">
          <Link href="/aviso-de-privacidad" className="underline">
            Aviso de privacidad
          </Link>
        </footer>
      </section>
    </main>
  );
}
