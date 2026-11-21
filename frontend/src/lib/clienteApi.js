const URL_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
  }
}

function leerCookie(nombre) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((elemento) => elemento.startsWith(`${nombre}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(nombre.length + 1));
}

async function obtenerTokenCsrf() {
  let token = leerCookie("XSRF-TOKEN");

  if (token) return token;

  const respuesta = await fetch(`${URL_API}/auth/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!respuesta.ok) {
    throw new ErrorApi(
      "No se pudo inicializar la seguridad.",
      respuesta.status,
    );
  }

  token = leerCookie("XSRF-TOKEN");

  if (!token) {
    throw new ErrorApi("No se recibió el token de seguridad.");
  }

  return token;
}

export async function peticionApi(ruta, { metodo = "GET", datos } = {}) {
  const encabezados = {};

  if (["POST", "PUT", "PATCH", "DELETE"].includes(metodo)) {
    encabezados["X-XSRF-TOKEN"] = await obtenerTokenCsrf();
  }

  const opciones = {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers: encabezados,
  };

  if (datos !== undefined) {
    encabezados["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}${ruta}`, opciones);
  } catch {
    throw new ErrorApi("No fue posible conectarse con el servidor.");
  }

  const texto = await respuesta.text();

  let contenido = null;

  if (texto) {
    try {
      contenido = JSON.parse(texto);
    } catch {
      contenido = texto;
    }
  }

  if (!respuesta.ok) {
    throw new ErrorApi(
      contenido?.mensaje ||
        contenido?.message ||
        `La solicitud falló (${respuesta.status}).`,
      respuesta.status,
    );
  }

  return contenido;
}
