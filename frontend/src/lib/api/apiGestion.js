// Cliente HTTP utilizado por Clientes e Ingresos.
// No modifica el cliente de autenticación existente.

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const METODOS_CON_CSRF = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function leerCookie(nombre) {
  if (typeof document === "undefined") {
    return null;
  }

  const entrada = document.cookie
    .split("; ")
    .find((parte) => parte.startsWith(`${nombre}=`));

  return entrada ? decodeURIComponent(entrada.slice(nombre.length + 1)) : null;
}

async function obtenerCsrf() {
  let token = leerCookie("XSRF-TOKEN");

  if (token) {
    return token;
  }

  // Rutas contempladas para inicializar CSRF.
  // Debe existir la ruta que use tu backend actual.

  for (const ruta of ["/autenticacion/csrf", "/auth/csrf"]) {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      credentials: "include",
      cache: "no-store",
    });

    if (respuesta.ok) {
      token = leerCookie("XSRF-TOKEN");

      if (token) {
        return token;
      }
    }
  }

  throw new Error("No se pudo obtener el token CSRF. Verifica tu sesión.");
}

export async function apiGestion(ruta, { method = "GET", body, signal } = {}) {
  const metodo = method.toUpperCase();

  const headers = {};

  if (METODOS_CON_CSRF.has(metodo)) {
    headers["X-XSRF-TOKEN"] = await obtenerCsrf();
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers,
    signal,

    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const tipo = respuesta.headers.get("content-type") ?? "";

  const resultado = tipo.includes("application/json")
    ? await respuesta.json()
    : await respuesta.text();

  if (!respuesta.ok) {
    throw new Error(
      resultado?.mensaje ||
        resultado?.message ||
        resultado?.detail ||
        (typeof resultado === "string" && resultado) ||
        `Error HTTP ${respuesta.status}`,
    );
  }

  return resultado?.datos ?? resultado?.data ?? resultado;
}
