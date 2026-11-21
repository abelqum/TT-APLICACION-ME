"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";

import CampoContrasena from "@/componentes/formularios/CampoContrasena";
import { servicioAutenticacion } from "@/servicios/servicioAutenticacion";

import { mostrarAdvertencia, mostrarError, mostrarExito } from "@/lib/alertas";

export default function PaginaRegistroEmpresa() {
  const enrutador = useRouter();

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [avisoLeido, setAvisoLeido] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function registrar(evento) {
    evento.preventDefault();

    if (
      !nombreEmpresa.trim() ||
      !nombre.trim() ||
      !correo.trim() ||
      !contrasena ||
      !confirmacion
    ) {
      await mostrarAdvertencia(
        "Datos incompletos",
        "Completa todos los campos para crear tu empresa.",
      );
      return;
    }

    if (contrasena.length < 15) {
      await mostrarAdvertencia(
        "Contraseña demasiado corta",
        "La contraseña debe tener al menos 15 caracteres.",
      );
      return;
    }

    if (contrasena !== confirmacion) {
      await mostrarAdvertencia(
        "Las contraseñas no coinciden",
        "Verifica la contraseña y su confirmación.",
      );
      return;
    }

    if (!avisoLeido) {
      await mostrarAdvertencia(
        "Aviso de privacidad",
        "Consulta el aviso de privacidad antes de continuar.",
      );
      return;
    }

    setCargando(true);

    try {
      await servicioAutenticacion.registrarEmpresa({
        nombreEmpresa: nombreEmpresa.trim(),
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena,
        confirmacionContrasena: confirmacion,
      });

      await mostrarExito(
        "Empresa creada",
        "Tu empresa y su cuenta administradora fueron registradas correctamente.",
      );

      enrutador.replace("/");
    } catch (error) {
      await mostrarError(
        "No se pudo completar el registro",
        error.message || "Ocurrió un error inesperado.",
      );
    } finally {
      setCargando(false);
    }
  }

  const claseCampo =
    "w-full rounded-lg border-2 border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-700";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="bg-brand-950 px-8 py-8 text-center text-white">
          <Building2 size={36} className="mx-auto mb-3" />

          <h1 className="text-3xl font-bold">Crear empresa</h1>

          <p className="mt-2 text-sm text-blue-100">
            Registra tu empresa y su administrador.
          </p>
        </header>

        <form onSubmit={registrar} noValidate className="space-y-4 p-8">
          <div>
            <label
              htmlFor="empresa"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nombre de la empresa
            </label>

            <input
              id="empresa"
              value={nombreEmpresa}
              onChange={(evento) => setNombreEmpresa(evento.target.value)}
              autoComplete="organization"
              maxLength={200}
              required
              disabled={cargando}
              className={claseCampo}
            />
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nombre del administrador
            </label>

            <input
              id="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              autoComplete="name"
              maxLength={150}
              required
              disabled={cargando}
              className={claseCampo}
            />
          </div>

          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-sm font-medium text-slate-700"
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
              required
              disabled={cargando}
              className={claseCampo}
            />
          </div>

          <CampoContrasena
            id="contrasena"
            etiqueta="Contraseña"
            valor={contrasena}
            alCambiar={setContrasena}
            autocompletar="new-password"
            longitudMinima={15}
            deshabilitado={cargando}
          />

          <CampoContrasena
            id="confirmacion"
            etiqueta="Confirmar contraseña"
            valor={confirmacion}
            alCambiar={setConfirmacion}
            autocompletar="new-password"
            longitudMinima={15}
            deshabilitado={cargando}
          />

          <p className="text-xs text-slate-500">
            Utiliza al menos 15 caracteres para tu contraseña.
          </p>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={avisoLeido}
              onChange={(evento) => setAvisoLeido(evento.target.checked)}
              disabled={cargando}
              className="mt-1"
            />

            <span>
              He leído el{" "}
              <Link
                href="/aviso-de-privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                aviso de privacidad
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-blue-800 p-3 font-bold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {cargando ? "Registrando..." : "Crear empresa"}
          </button>

          <p className="text-center text-sm">
            <Link href="/" className="text-blue-700 underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
