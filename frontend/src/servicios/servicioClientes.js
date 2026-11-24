import { apiGestion } from "@/lib/api/apiGestion";

export const servicioClientes = {
  registrar(datos) {
    return apiGestion("/clientes", {
      method: "POST",
      body: datos,
    });
  },

  async listar({ buscar = "", pagina = 0, tamano = 30, signal } = {}) {
    const parametros = new URLSearchParams({
      buscar: buscar.trim(),
      page: String(pagina),
      size: String(tamano),
    });

    const respuesta = await apiGestion(`/clientes?${parametros}`, { signal });

    if (!Array.isArray(respuesta?.content)) {
      throw new Error("El servidor no devolvió una página válida de clientes.");
    }

    return respuesta;
  },
};
