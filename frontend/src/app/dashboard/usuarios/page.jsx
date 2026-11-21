"use client";

import { useState } from "react";

import { useSesionDashboard } from "@/contextos/ContextoSesionDashboard";
import { servicioUsuarios } from "@/servicios/servicioUsuarios";

import CampoContrasena from "@/componentes/formularios/CampoContrasena";

import { mostrarAdvertencia, mostrarError, mostrarExito } from "@/lib/alertas";
import ListaEmpleados from "@/componentes/usuarios/ListaEmpleados";
export default function PaginaUsuarios() {
  const { usuario } = useSesionDashboard();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [revisionEmpleados, setRevisionEmpleados] = useState(0);
  async function registrarEmpleado(evento) {
    evento.preventDefault();

    if (!nombre.trim() || !correo.trim() || !contrasena) {
      await mostrarAdvertencia(
        "Datos incompletos",
        "Completa los datos del empleado.",
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

    setCargando(true);

    try {
      await servicioUsuarios.registrarEmpleado({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena,
      });

      await mostrarExito(
        "Empleado registrado",
        "El usuario fue creado correctamente.",
      );
      setRevisionEmpleados((actual) => actual + 1);
      setNombre("");
      setCorreo("");
      setContrasena("");
    } catch (error) {
      await mostrarError(
        "No se pudo registrar al empleado",
        error.message || "Ocurrió un error inesperado.",
      );
    } finally {
      setCargando(false);
    }
  }

  if (usuario.rol !== "ADMIN") {
    return (
      <p className="text-red-700">
        No tienes permiso para administrar usuarios.
      </p>
    );
  }

  const claseCampo =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-700";

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Registrar empleado</h2>

        <p className="mt-2 text-sm text-slate-500">
          Los empleados registrados pertenecerán a tu empresa y tendrán el rol
          EMPLEADO.
        </p>

        <form
          onSubmit={registrarEmpleado}
          noValidate
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="nombre-empleado"
              className="mb-2 block text-sm font-medium"
            >
              Nombre
            </label>

            <input
              id="nombre-empleado"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              maxLength={150}
              required
              disabled={cargando}
              className={claseCampo}
            />
          </div>

          <div>
            <label
              htmlFor="correo-empleado"
              className="mb-2 block text-sm font-medium"
            >
              Correo electrónico
            </label>

            <input
              id="correo-empleado"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              maxLength={200}
              required
              disabled={cargando}
              className={claseCampo}
            />
          </div>

          <CampoContrasena
            id="contrasena-empleado"
            etiqueta="Contraseña inicial"
            valor={contrasena}
            alCambiar={setContrasena}
            autocompletar="new-password"
            longitudMinima={15}
            deshabilitado={cargando}
          />

          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-blue-800 px-6 py-3 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {cargando ? "Registrando..." : "Registrar empleado"}
          </button>
        </form>
        <ListaEmpleados key={revisionEmpleados} />
      </section>
    </div>
  );
}
