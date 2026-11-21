"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function CampoContrasena({
  id,
  etiqueta = "Contraseña",
  valor,
  alCambiar,
  autocompletar = "current-password",
  deshabilitado = false,
  longitudMinima = 1,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
      >
        {etiqueta}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          autoComplete={autocompletar}
          minLength={longitudMinima}
          maxLength={128}
          required
          disabled={deshabilitado}
          className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 p-3 pr-12 text-slate-900 outline-none focus:border-blue-700"
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          disabled={deshabilitado}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-3 text-slate-500 hover:text-blue-700"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}
