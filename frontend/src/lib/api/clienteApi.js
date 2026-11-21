export const URL_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const METODOS_PROTEGIDOS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
  }
}

function leerCookie(nombre) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((valor) => valor.startsWith(`${nombre}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(nombre.length + 1));
}

async function obtenerTokenCsrf(signal) {
  const respuesta = await fetch(`${URL_API}/autenticacion/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!respuesta.ok) {
    throw new ErrorApi(
      "No fue posible inicializar la seguridad.",
      respuesta.status,
    );
  }

  const token = leerCookie("XSRF-TOKEN");

  if (!token) {
    throw new ErrorApi("No se recibió el token de seguridad.");
  }

  return token;
}

export async function clienteApi(ruta, { metodo = "GET", datos, signal } = {}) {
  const metodoNormalizado = metodo.toUpperCase();
  const encabezados = {};

  if (METODOS_PROTEGIDOS.has(metodoNormalizado)) {
    try {
      encabezados["X-XSRF-TOKEN"] = await obtenerTokenCsrf(signal);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (error instanceof ErrorApi) throw error;

      throw new ErrorApi("No fue posible conectarse con el servidor.");
    }
  }

  const opciones = {
    method: metodoNormalizado,
    credentials: "include",
    cache: "no-store",
    headers: encabezados,
    signal,
  };

  if (datos !== undefined) {
    encabezados["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}${ruta}`, opciones);
  } catch (error) {
    if (error.name === "AbortError") throw error;

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
    const mensaje =
      contenido?.mensaje ||
      contenido?.message ||
      `Error HTTP ${respuesta.status}`;

    throw new ErrorApi(mensaje, respuesta.status);
  }

  return contenido;
}
