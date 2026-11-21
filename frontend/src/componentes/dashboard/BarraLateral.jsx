"use client";

import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  CircleDollarSign,
  ReceiptText,
  Boxes,
  Plane,
  ListTodo,
  LogOut,
  X,
} from "lucide-react";

const ENLACES = [
  {
    nombre: "Inicio",
    ruta: "/dashboard",
    icono: LayoutDashboard,
    roles: ["ADMIN", "EMPLEADO"],
    habilitado: true,
  },
  {
    nombre: "Ingresos",
    ruta: "/dashboard/ingresos",
    icono: CircleDollarSign,
    roles: ["ADMIN"],
    habilitado: false,
  },
  {
    nombre: "Egresos",
    ruta: "/dashboard/egresos",
    icono: ReceiptText,
    roles: ["ADMIN"],
    habilitado: false,
  },
  {
    nombre: "Inventario",
    ruta: "/dashboard/inventario",
    icono: Boxes,
    roles: ["ADMIN", "EMPLEADO"],
    habilitado: false,
  },
  {
    nombre: "Viáticos",
    ruta: "/dashboard/viaticos",
    icono: Plane,
    roles: ["ADMIN", "EMPLEADO"],
    habilitado: false,
  },
  {
    nombre: "Tareas",
    ruta: "/dashboard/tareas",
    icono: ListTodo,
    roles: ["ADMIN", "EMPLEADO"],
    habilitado: false,
  },
  {
    nombre: "Usuarios",
    ruta: "/dashboard/usuarios",
    icono: Users,
    roles: ["ADMIN"],
    habilitado: true,
  },
];

export function obtenerTituloRuta(ruta) {
  return ENLACES.find((enlace) => enlace.ruta === ruta)?.nombre || "Dashboard";
}

export function rutaPermitida(ruta, rol) {
  return ENLACES.some(
    (enlace) =>
      enlace.habilitado && enlace.ruta === ruta && enlace.roles.includes(rol),
  );
}

export default function BarraLateral({
  rutaActual,
  usuario,
  abierta,
  cerrarMenu,
  cerrarSesion,
}) {
  const enlaces = ENLACES.filter((enlace) =>
    enlace.roles.includes(usuario.rol),
  );

  return (
    <>
      {abierta && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col bg-brand-950 text-white shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abierta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-22 items-center justify-between border-b border-white/10 px-5">
          <div>
            <h2 className="text-lg font-black">Sistema de Gestión</h2>
            <p className="mt-1 text-xs text-blue-200">
              {usuario.empresa?.nombre || "Microempresa"}
            </p>
          </div>

          <button
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {enlaces.map((enlace) => {
            const Icono = enlace.icono;

            if (!enlace.habilitado) {
              return (
                <div
                  key={enlace.ruta}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-200/50"
                  title="Disponible en un incremento posterior"
                >
                  <Icono size={19} />
                  {enlace.nombre}
                </div>
              );
            }

            const activo = rutaActual === enlace.ruta;

            return (
              <Link
                key={enlace.ruta}
                href={enlace.ruta}
                onClick={cerrarMenu}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  activo
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                <Icono size={19} />
                {enlace.nombre}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={cerrarSesion}
          className="m-3 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-900/30"
        >
          <LogOut size={19} />
          Cerrar sesión
        </button>
      </aside>
    </>
  );
}
