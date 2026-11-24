import { apiGestion } from "@/lib/api/apiGestion";

function queryFiltros(filtros = {}) {
  const parametros = new URLSearchParams();

  for (const [nombre, valor] of Object.entries(filtros)) {
    if (nombre === "clienteNombre") {
      continue;
    }

    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      parametros.set(nombre, String(valor).trim());
    }
  }

  return parametros;
}

export const servicioIngresos = {
  registrar(datos) {
    return apiGestion("/ingresos", {
      method: "POST",
      body: datos,
    });
  },

  listar({ pagina = 0, tamano = 20, filtros = {}, signal } = {}) {
    const parametros = queryFiltros(filtros);

    parametros.set("page", String(pagina));
    parametros.set("size", String(tamano));

    return apiGestion(`/ingresos?${parametros}`, { signal });
  },

  resumen({ filtros = {}, signal } = {}) {
    return apiGestion(`/ingresos/resumen?${queryFiltros(filtros)}`, { signal });
  },

  reporte({ filtros = {}, signal } = {}) {
    return apiGestion(`/ingresos/reporte?${queryFiltros(filtros)}`, { signal });
  },

  consultar(id, { signal } = {}) {
    return apiGestion(`/ingresos/${id}`, { signal });
  },

  actualizar(id, datos) {
    return apiGestion(`/ingresos/${id}`, {
      method: "PUT",
      body: datos,
    });
  },

  cancelar(id) {
    return apiGestion(`/ingresos/${id}/cancelar`, {
      method: "POST",
    });
  },
};
