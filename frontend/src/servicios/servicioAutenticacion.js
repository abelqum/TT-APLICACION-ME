import { clienteApi } from "@/lib/api/clienteApi";

function normalizarUsuario(respuesta) {
  const usuario = respuesta?.datos ?? respuesta;

  if (!usuario || !usuario.id) {
    throw new Error("El servidor no devolvió un usuario válido.");
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    empresa: usuario.empresa
      ? {
          id: usuario.empresa.id,
          nombre: usuario.empresa.nombre,
        }
      : null,
  };
}

export const servicioAutenticacion = {
  async iniciarSesion(correo, contrasena) {
    return clienteApi("/autenticacion/iniciar-sesion", {
      metodo: "POST",
      datos: { correo, contrasena },
    });
  },

  async registrarEmpresa(datos) {
    return clienteApi("/autenticacion/registrar-empresa", {
      metodo: "POST",
      datos,
    });
  },

  async obtenerSesion({ signal } = {}) {
    const respuesta = await clienteApi("/autenticacion/sesion", { signal });

    return normalizarUsuario(respuesta);
  },

  async cerrarSesion() {
    return clienteApi("/autenticacion/cerrar-sesion", { metodo: "POST" });
  },
};
