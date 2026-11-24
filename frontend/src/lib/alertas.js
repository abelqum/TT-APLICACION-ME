"use client";

import Swal from "sweetalert2";

const alertas = Swal.mixin({
  confirmButtonText: "Aceptar",
  confirmButtonColor: "#1d4ed8",
  cancelButtonColor: "#64748b",
  heightAuto: false,
});

export function mostrarExito(titulo, texto = "") {
  return alertas.fire({
    icon: "success",
    title: titulo,
    text: texto,
    timer: 1400,
    showConfirmButton: false,
    timerProgressBar: true,
  });
}

export function mostrarError(titulo, texto = "") {
  return alertas.fire({
    icon: "error",
    title: titulo,
    text: texto,
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#dc2626",
  });
}

export function mostrarAdvertencia(titulo, texto = "") {
  return alertas.fire({
    icon: "warning",
    title: titulo,
    text: texto,
  });
}

export function mostrarInformacion(titulo, texto = "") {
  return alertas.fire({
    icon: "info",
    title: titulo,
    text: texto,
  });
}

export async function confirmarAccion({
  titulo,
  texto = "",
  textoConfirmar = "Sí, continuar",
  peligro = false,
}) {
  const resultado = await alertas.fire({
    icon: peligro ? "warning" : "question",
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: "Cancelar",
    confirmButtonColor: peligro ? "#dc2626" : "#1d4ed8",
    reverseButtons: true,
  });

  return resultado.isConfirmed;
}

export function mostrarCarga(titulo = "Procesando...") {
  return alertas.fire({
    title: titulo,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
}

export function cerrarCarga() {
  Swal.close();
}

export async function mostrarMensajeGestion(titulo, mensaje, tipo = "success") {
  const { default: Swal } = await import("sweetalert2");

  const dialogoAbierto = document.querySelector("dialog[open]");

  return Swal.fire({
    target: dialogoAbierto || document.body,
    icon: tipo,
    title: titulo,
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
}

export function obtenerMensajeErrorGestion(error) {
  return (
    error?.mensaje ||
    error?.message ||
    "Ocurrió un error al realizar la operación."
  );
}
