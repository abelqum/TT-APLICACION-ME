import { clienteApi } from "@/lib/api/clienteApi";

function registrarEmpleado(datos) {
  return clienteApi("/usuarios/empleados", {
    metodo: "POST",
    datos: {
      nombre: datos.nombre,
      correo: datos.correo,
      contrasena: datos.contrasena,
    },
  });
}

export const servicioUsuarios = {
  registrarEmpleado,

  // Alias si el formulario utiliza este nombre.
  crearEmpleado: registrarEmpleado,

  listarEmpleados() {
    return clienteApi("/usuarios/empleados");
  },
};
