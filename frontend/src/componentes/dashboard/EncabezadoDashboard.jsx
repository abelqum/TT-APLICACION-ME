"use client";

import { Menu, LogOut } from "lucide-react";

export default function EncabezadoDashboard({
  titulo,
  usuario,
  abrirMenu,
  cerrarSesion,
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-18 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={abrirMenu}
          aria-label="Abrir menú"
          className="rounded-lg border border-slate-200 p-2 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div>
          <h1 className="text-lg font-black text-brand-950">{titulo}</h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Sistema de Gestión para Microempresas
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-700">{usuario.nombre}</p>
          <p className="text-xs text-blue-700">
            {usuario.rol === "ADMIN" ? "Administrador" : "Empleado"}
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
