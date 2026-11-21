"use client";

import { useSesionDashboard } from "@/contextos/ContextoSesionDashboard";
import { Building2, ShieldCheck } from "lucide-react";

export default function PaginaDashboard() {
  const { usuario, empresa } = useSesionDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">
          Bienvenido, {usuario.nombre}
        </h2>
        <p className="mt-2 text-slate-500">
          Has iniciado sesión correctamente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Building2 className="mb-3 text-blue-700" size={28} />
          <h3 className="font-bold text-slate-800">Empresa</h3>
          <p className="mt-2 text-slate-600">
            {empresa?.nombre || "Sin empresa"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="mb-3 text-blue-700" size={28} />
          <h3 className="font-bold text-slate-800">Rol de usuario</h3>
          <p className="mt-2 text-slate-600">
            {usuario.rol === "ADMIN" ? "Administrador" : "Empleado"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-bold text-blue-900">Incremento 1: Autenticación</h3>
        <p className="mt-2 text-sm text-blue-800">
          Esta pantalla es provisional. Los indicadores, gráficas y módulos
          administrativos se incorporarán en los siguientes incrementos.
        </p>
      </div>
    </div>
  );
}
