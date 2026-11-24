"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { X, Pencil, Package, Wrench, Plus, Trash2, Ban } from "lucide-react";

import BuscadorClientes from "@/componentes/ingresos/BuscadorClientes";

import { servicioIngresos } from "@/servicios/servicioIngresos";

import {
  mostrarMensajeGestion,
  obtenerMensajeErrorGestion,
} from "@/lib/alertas";

// ==========================================
// CATALOGO TEMPORAL DE TT1
// ==========================================

const PRODUCTOS_DEMO = [
  {
    claveArticulo: "MAR-001",
    concepto: "Martillo",
    unidadMedida: "PIEZA",
    precioUnitario: "50.00",
    tasaIva: "0.16",
  },
  {
    claveArticulo: "ESC-001",
    concepto: "Escoba",
    unidadMedida: "PIEZA",
    precioUnitario: "80.00",
    tasaIva: "0.16",
  },
  {
    claveArticulo: "CLA-001",
    concepto: "Caja de clavos",
    unidadMedida: "CAJA",
    precioUnitario: "20.00",
    tasaIva: "0.16",
  },
];

const SERVICIO_INICIAL = {
  concepto: "",
  cantidad: "1",
  precioUnitario: "",
  unidadMedida: "SERVICIO",
  tasaIva: "0.16",
};

const LIMITE = 99999999999999n;

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function centavos(valor, escala) {
  const texto = String(valor ?? "").trim();

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return null;
  }

  const [entero, dec = ""] = texto.split(".");

  if (dec.length > escala) {
    return null;
  }

  return (
    BigInt(entero) * 10n ** BigInt(escala) +
    BigInt(dec.padEnd(escala, "0") || "0")
  );
}

function decimalValido(valor, enteros, decimales) {
  const texto = String(valor ?? "");

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return false;
  }

  const [parteEntera, dec = ""] = texto.split(".");

  return (
    parteEntera.length <= enteros &&
    dec.length <= decimales &&
    Number(texto) > 0
  );
}

function calcular(item) {
  const cantidad = centavos(item.cantidad, 3);
  const precio = centavos(item.precioUnitario, 2);

  if (cantidad === null || precio === null || cantidad <= 0n || precio <= 0n) {
    return {
      subtotal: 0n,
      iva: 0n,
      total: 0n,
    };
  }

  const total = (cantidad * precio + 500n) / 1000n;

  const tasa = item.tasaIva === "0.16" ? 1600n : 0n;

  const divisor = 10000n + tasa;

  const subtotal = (total * 10000n + divisor / 2n) / divisor;

  return {
    total,
    subtotal,
    iva: total - subtotal,
  };
}

function moneda(importe) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(importe) / 100);
}

function hoy() {
  const fecha = new Date();

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

// ==========================================
// MODAL DE EDICION
// ==========================================

export default function EditarIngresoModal({ registro, alGuardar, alCerrar }) {
  const dialogoRef = useRef(null);

  const secuencia = useRef(registro.detalles.length);

  const encabezado = registro.ingreso;

  const [tipo, setTipo] = useState("PRODUCTO");

  // Cargar los conceptos existentes.

  const [carrito, setCarrito] = useState(() =>
    registro.detalles.map((detalle, indice) => ({
      ...detalle,
      idLocal: indice + 1,
      cantidad: String(detalle.cantidad),
      precioUnitario: String(detalle.precioUnitario),
      tasaIva: String(detalle.tasaIva),
    })),
  );

  const [productoClave, setProductoClave] = useState("");

  const [servicio, setServicio] = useState(SERVICIO_INICIAL);

  // Datos existentes de factura y cliente.

  const [tieneFactura, setTieneFactura] = useState(encabezado.tieneFactura);

  const [clienteId, setClienteId] = useState(
    encabezado.clienteId ? String(encabezado.clienteId) : "",
  );

  const [numeroFactura, setNumeroFactura] = useState(
    encabezado.numeroFactura ?? "",
  );

  const [uuidFiscal, setUuidFiscal] = useState(encabezado.uuidFiscal ?? "");

  const [fechaFactura, setFechaFactura] = useState(encabezado.fecha ?? hoy());

  const [fechaPago, setFechaPago] = useState(encabezado.fechaPago ?? hoy());

  const [estadoPago, setEstadoPago] = useState(encabezado.estadoPago);

  const [metodoPago, setMetodoPago] = useState(encabezado.metodoPago ?? "");

  const [observaciones, setObservaciones] = useState(
    encabezado.observaciones ?? "",
  );

  const [guardando, setGuardando] = useState(false);

  // ==========================================
  // ABRIR DIALOGO
  // ==========================================

  useEffect(() => {
    const modal = dialogoRef.current;

    if (modal && !modal.open) {
      modal.showModal();
    }

    return () => {
      if (modal?.open) {
        modal.close();
      }
    };
  }, []);

  function cerrar() {
    if (!guardando) {
      alCerrar?.();
    }
  }

  // ==========================================
  // EDITAR CONCEPTOS
  // ==========================================

  function cambiarItem(id, nombre, valor) {
    setCarrito((anterior) =>
      anterior.map((item) =>
        item.idLocal === id ? { ...item, [nombre]: valor } : item,
      ),
    );
  }

  function agregarProducto() {
    const producto = PRODUCTOS_DEMO.find(
      (item) => item.claveArticulo === productoClave,
    );

    if (!producto) {
      return;
    }

    const existente = carrito.find(
      (item) =>
        item.tipoConcepto === "PRODUCTO" &&
        item.claveArticulo === producto.claveArticulo,
    );

    if (existente) {
      cambiarItem(
        existente.idLocal,
        "cantidad",
        String(Number(existente.cantidad) + 1),
      );
    } else {
      const idLocal = ++secuencia.current;

      setCarrito((anterior) => [
        ...anterior,
        {
          ...producto,
          idLocal,
          tipoConcepto: "PRODUCTO",
          cantidad: "1",
        },
      ]);
    }

    setProductoClave("");
  }

  async function agregarServicio() {
    const item = {
      ...servicio,
      tipoConcepto: "SERVICIO",
      claveArticulo: null,
    };

    if (
      !servicio.concepto.trim() ||
      !servicio.unidadMedida.trim() ||
      !decimalValido(item.cantidad, 9, 3) ||
      !decimalValido(item.precioUnitario, 12, 2) ||
      calcular(item).total <= 0n
    ) {
      await mostrarMensajeGestion(
        "Servicio inválido",
        "Revisa descripción, cantidad y precio.",
        "warning",
      );

      return;
    }

    const idLocal = ++secuencia.current;

    setCarrito((anterior) => [
      ...anterior,
      {
        ...item,
        concepto: item.concepto.trim(),
        idLocal,
      },
    ]);

    setServicio({ ...SERVICIO_INICIAL });
  }

  // ==========================================
  // RESUMEN
  // ==========================================

  const resumen = carrito.reduce(
    (acumulado, item) => {
      const calculo = calcular(item);

      return {
        subtotal: acumulado.subtotal + calculo.subtotal,

        iva: acumulado.iva + calculo.iva,

        total: acumulado.total + calculo.total,
      };
    },
    {
      subtotal: 0n,
      iva: 0n,
      total: 0n,
    },
  );

  // ==========================================
  // FACTURA Y PAGO
  // ==========================================

  function cambiarFactura(valor) {
    setTieneFactura(valor);

    if (!valor) {
      setClienteId("");
      setNumeroFactura("");
      setUuidFiscal("");

      setEstadoPago("PAGADO");
      setMetodoPago("EFECTIVO");
    }
  }

  function cambiarEstadoPago(valor) {
    setEstadoPago(valor);

    if (valor === "PENDIENTE") {
      setMetodoPago("");
    } else {
      setMetodoPago("EFECTIVO");
      setFechaPago(hoy());
    }
  }

  // ==========================================
  // GUARDAR CAMBIOS
  // ==========================================

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    const conceptosInvalidos =
      carrito.length === 0 ||
      carrito.length > 100 ||
      resumen.total <= 0n ||
      resumen.total > LIMITE ||
      carrito.some((item) => {
        const calculo = calcular(item);

        return (
          !item.concepto?.trim() ||
          !item.unidadMedida?.trim() ||
          !decimalValido(item.cantidad, 9, 3) ||
          !decimalValido(item.precioUnitario, 12, 2) ||
          calculo.total <= 0n ||
          calculo.total > LIMITE
        );
      });

    if (conceptosInvalidos) {
      await mostrarMensajeGestion(
        "Revisa los conceptos",
        "Corrige cantidades, precios o descripciones.",
        "warning",
      );

      return;
    }

    if (
      tieneFactura &&
      (!clienteId ||
        !numeroFactura.trim() ||
        !fechaFactura ||
        (estadoPago === "PAGADO" && !fechaPago))
    ) {
      await mostrarMensajeGestion(
        "Factura incompleta",
        "Completa el cliente, número y fechas requeridas.",
        "warning",
      );

      return;
    }

    const datos = {
      fecha: tieneFactura ? fechaFactura : null,

      fechaPago: tieneFactura && estadoPago === "PAGADO" ? fechaPago : null,

      clienteId: tieneFactura ? Number(clienteId) : null,

      tieneFactura,

      numeroFactura: tieneFactura ? numeroFactura.trim() : null,

      uuidFiscal: tieneFactura ? uuidFiscal.trim() || null : null,

      estadoPago: tieneFactura ? estadoPago : "PAGADO",

      metodoPago: !tieneFactura || estadoPago === "PAGADO" ? metodoPago : null,

      observaciones: observaciones.trim() || null,

      detalles: carrito.map((item) => ({
        tipoConcepto: item.tipoConcepto,

        claveArticulo: item.claveArticulo || null,

        concepto: item.concepto.trim(),

        unidadMedida: item.unidadMedida.trim(),

        cantidad: item.cantidad,

        precioUnitario: item.precioUnitario,

        tasaIva: item.tasaIva,
      })),
    };

    setGuardando(true);

    try {
      const actualizado = await servicioIngresos.actualizar(
        encabezado.id,
        datos,
      );

      await mostrarMensajeGestion(
        "Cambios guardados",
        `Se actualizó ${actualizado.ingreso.folio}.`,
      );

      alGuardar?.(actualizado);
    } catch (excepcion) {
      await mostrarMensajeGestion(
        "No se pudo actualizar",
        obtenerMensajeErrorGestion(excepcion),
        "error",
      );
    } finally {
      setGuardando(false);
    }
  }

  // ==========================================
  // CANCELAR INGRESO
  // ==========================================

  async function cancelarIngreso() {
    if (guardando) {
      return;
    }

    const { default: Swal } = await import("sweetalert2");

    const respuesta = await Swal.fire({
      target: dialogoRef.current,
      icon: "warning",
      title: "¿Cancelar este ingreso?",

      text: `El folio ${encabezado.folio} permanecerá en el historial, pero no sumará a los totales.`,

      showCancelButton: true,

      confirmButtonText: "Sí, cancelar ingreso",

      cancelButtonText: "Volver",

      confirmButtonColor: "#b91c1c",
    });

    if (!respuesta.isConfirmed) {
      return;
    }

    setGuardando(true);

    try {
      const cancelado = await servicioIngresos.cancelar(encabezado.id);

      await mostrarMensajeGestion(
        "Ingreso cancelado",
        `Se canceló ${cancelado.ingreso.folio}.`,
      );

      alGuardar?.(cancelado);
    } catch (excepcion) {
      await mostrarMensajeGestion(
        "No se pudo cancelar",
        obtenerMensajeErrorGestion(excepcion),
        "error",
      );
    } finally {
      setGuardando(false);
    }
  }

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-600";

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-editar-ingreso"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
      className="m-auto max-h-[94dvh] w-[min(96vw,1050px)] rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
    >
      <form onSubmit={guardar} className="flex max-h-[94dvh] flex-col">
        {/* ENCABEZADO */}

        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2
              id="titulo-editar-ingreso"
              className="flex items-center gap-2 text-xl font-bold"
            >
              <Pencil size={20} />
              Editar ingreso {encabezado.folio}
            </h2>

            <p className="text-xs text-slate-500">
              El folio, la empresa y la fecha original de creación no cambian.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrar}
            disabled={guardando}
            aria-label="Cerrar editor"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </header>

        {/* CONTENIDO DESPLAZABLE */}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* PRODUCTOS Y SERVICIOS */}

          <section className="space-y-3">
            <h3 className="font-bold">1. Conceptos de la operación</h3>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {[
                ["PRODUCTO", Package, "Producto"],
                ["SERVICIO", Wrench, "Servicio"],
              ].map(([clave, Icono, titulo]) => (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setTipo(clave)}
                  className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-semibold ${
                    tipo === clave
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  <Icono size={18} />
                  {titulo}
                </button>
              ))}
            </div>

            {tipo === "PRODUCTO" ? (
              <div className="flex flex-wrap gap-2 rounded-xl border p-3">
                <select
                  className={`${campo} min-w-0 flex-1`}
                  value={productoClave}
                  onChange={(evento) => setProductoClave(evento.target.value)}
                >
                  <option value="">
                    Seleccionar producto de demostración...
                  </option>

                  {PRODUCTOS_DEMO.map((producto) => (
                    <option
                      value={producto.claveArticulo}
                      key={producto.claveArticulo}
                    >
                      {producto.claveArticulo} — {producto.concepto}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={agregarProducto}
                  disabled={!productoClave}
                  className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            ) : (
              <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-4">
                <label className="sm:col-span-4">
                  <span className="text-xs">Descripción del servicio</span>

                  <input
                    className={campo}
                    maxLength={200}
                    value={servicio.concepto}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        concepto: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span className="text-xs">Unidad</span>

                  <input
                    className={campo}
                    maxLength={40}
                    value={servicio.unidadMedida}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        unidadMedida: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span className="text-xs">Cantidad</span>

                  <input
                    className={campo}
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={servicio.cantidad}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        cantidad: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span className="text-xs">Precio final</span>

                  <input
                    className={campo}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={servicio.precioUnitario}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        precioUnitario: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span className="text-xs">IVA</span>

                  <select
                    className={campo}
                    value={servicio.tasaIva}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        tasaIva: evento.target.value,
                      }))
                    }
                  >
                    <option value="0.16">16 %</option>
                    <option value="0">0 %</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={agregarServicio}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white sm:col-span-4"
                >
                  <Plus size={16} />
                  Agregar servicio
                </button>
              </div>
            )}
          </section>

          {/* RESUMEN Y EDICION DE CONCEPTOS */}

          <section className="space-y-3">
            <h3 className="font-bold">2. Resumen y edición de conceptos</h3>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[690px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">IVA</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Quitar</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {carrito.map((item) => (
                    <tr key={item.idLocal}>
                      <td className="p-3">
                        {item.tipoConcepto === "SERVICIO" ? (
                          <div className="space-y-1">
                            <input
                              aria-label="Descripción del servicio"
                              maxLength={200}
                              value={item.concepto}
                              onChange={(evento) =>
                                cambiarItem(
                                  item.idLocal,
                                  "concepto",
                                  evento.target.value,
                                )
                              }
                              className="w-full rounded-lg border p-2"
                            />

                            <input
                              aria-label="Unidad de medida"
                              maxLength={40}
                              value={item.unidadMedida}
                              onChange={(evento) =>
                                cambiarItem(
                                  item.idLocal,
                                  "unidadMedida",
                                  evento.target.value,
                                )
                              }
                              className="w-full rounded-lg border p-2 text-xs"
                            />
                          </div>
                        ) : (
                          <>
                            <strong>{item.concepto}</strong>

                            <p className="text-xs text-slate-500">
                              {item.claveArticulo}
                            </p>
                          </>
                        )}
                      </td>

                      <td className="p-3">
                        <input
                          aria-label={`Cantidad de ${item.concepto}`}
                          className="w-24 rounded-lg border p-2"
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.cantidad}
                          onChange={(evento) =>
                            cambiarItem(
                              item.idLocal,
                              "cantidad",
                              evento.target.value,
                            )
                          }
                        />
                      </td>

                      <td className="p-3">
                        {item.tipoConcepto === "PRODUCTO" ? (
                          <span className="font-medium">
                            {moneda(centavos(item.precioUnitario, 2) ?? 0n)}

                            <small className="block text-slate-500">
                              Bloqueado
                            </small>
                          </span>
                        ) : (
                          <input
                            aria-label={`Precio de ${item.concepto}`}
                            className="w-28 rounded-lg border p-2"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.precioUnitario}
                            onChange={(evento) =>
                              cambiarItem(
                                item.idLocal,
                                "precioUnitario",
                                evento.target.value,
                              )
                            }
                          />
                        )}
                      </td>

                      <td className="p-3">
                        {item.tipoConcepto === "PRODUCTO" ? (
                          `${Number(item.tasaIva) * 100} %`
                        ) : (
                          <select
                            aria-label={`IVA de ${item.concepto}`}
                            className="rounded-lg border p-2"
                            value={item.tasaIva}
                            onChange={(evento) =>
                              cambiarItem(
                                item.idLocal,
                                "tasaIva",
                                evento.target.value,
                              )
                            }
                          >
                            <option value="0.16">16 %</option>
                            <option value="0">0 %</option>
                          </select>
                        )}
                      </td>

                      <td className="p-3 font-bold">
                        {moneda(calcular(item).total)}
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          title="Quitar"
                          aria-label={`Quitar ${item.concepto}`}
                          onClick={() =>
                            setCarrito((items) =>
                              items.filter(
                                (actual) => actual.idLocal !== item.idLocal,
                              ),
                            )
                          }
                          className="rounded-lg p-2 text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALES */}

            <div className="ml-auto max-w-xs space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{moneda(resumen.subtotal)}</strong>
              </div>

              <div className="flex justify-between">
                <span>IVA incluido</span>
                <strong>{moneda(resumen.iva)}</strong>
              </div>

              <div className="flex justify-between border-t pt-2 text-lg font-black">
                <span>Total</span>
                <span>{moneda(resumen.total)}</span>
              </div>
            </div>
          </section>

          {/* PAGO Y FACTURA */}

          <section className="space-y-3 border-t pt-5">
            <h3 className="font-bold">3. Pago y factura</h3>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              Registro original:{" "}
              {encabezado.creadoEn
                ? new Date(encabezado.creadoEn).toLocaleString("es-MX")
                : encabezado.fecha}
            </div>

            <label className="flex items-center justify-between rounded-xl border p-4 text-sm font-semibold">
              Factura externa
              <input
                type="checkbox"
                role="switch"
                checked={tieneFactura}
                onChange={(evento) => cambiarFactura(evento.target.checked)}
                className="h-5 w-5 accent-blue-700"
              />
            </label>

            {tieneFactura && (
              <div className="space-y-3 rounded-xl border p-4">
                <label className="block text-sm">Cliente *</label>

                <BuscadorClientes
                  requerido
                  valor={clienteId}
                  clienteInicial={
                    encabezado.clienteId
                      ? {
                          id: encabezado.clienteId,
                          nombre: encabezado.clienteNombre,
                        }
                      : null
                  }
                  alCambiar={(id) => setClienteId(id)}
                />

                <Link
                  href="/dashboard/clientes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-700 underline"
                >
                  Registrar un cliente nuevo
                </Link>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs">Número de factura *</span>

                    <input
                      required
                      maxLength={100}
                      className={campo}
                      value={numeroFactura}
                      onChange={(evento) =>
                        setNumeroFactura(evento.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span className="text-xs">Fecha de factura *</span>

                    <input
                      required
                      type="date"
                      className={campo}
                      value={fechaFactura}
                      onChange={(evento) =>
                        setFechaFactura(evento.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span className="text-xs">UUID fiscal (opcional)</span>

                    <input
                      maxLength={36}
                      className={campo}
                      value={uuidFiscal}
                      onChange={(evento) => setUuidFiscal(evento.target.value)}
                    />
                  </label>

                  <label>
                    <span className="text-xs">Estado de pago</span>

                    <select
                      className={campo}
                      value={estadoPago}
                      onChange={(evento) =>
                        cambiarEstadoPago(evento.target.value)
                      }
                    >
                      <option value="PAGADO">Pagado</option>

                      <option value="PENDIENTE">Pendiente</option>
                    </select>
                  </label>

                  {estadoPago === "PAGADO" && (
                    <label>
                      <span className="text-xs">Fecha de pago *</span>

                      <input
                        required
                        type="date"
                        className={campo}
                        value={fechaPago}
                        onChange={(evento) => setFechaPago(evento.target.value)}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {(!tieneFactura || estadoPago === "PAGADO") && (
              <label className="block text-sm">
                <span className="mb-1 block">Método de pago</span>

                <select
                  className={campo}
                  value={metodoPago}
                  onChange={(evento) => setMetodoPago(evento.target.value)}
                >
                  <option value="EFECTIVO">Efectivo</option>

                  <option value="TRANSFERENCIA">Transferencia</option>

                  <option value="TARJETA_DEBITO">Tarjeta de débito</option>

                  <option value="TARJETA_CREDITO">Tarjeta de crédito</option>

                  <option value="OTRO">Otro</option>
                </select>
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-1 block">Observaciones</span>

              <textarea
                rows={2}
                maxLength={1000}
                className={campo}
                value={observaciones}
                onChange={(evento) => setObservaciones(evento.target.value)}
              />
            </label>
          </section>
        </div>

        {/* PIE DEL MODAL */}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-5 py-4">
          <div>
            <p className="text-xs text-slate-500">Total actualizado</p>

            <strong className="text-xl">{moneda(resumen.total)}</strong>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={guardando}
              onClick={cancelarIngreso}
              className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"
            >
              <Ban size={16} />
              Cancelar ingreso
            </button>

            <button
              type="button"
              disabled={guardando}
              onClick={cerrar}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Volver
            </button>

            <button
              type="submit"
              disabled={guardando || !carrito.length}
              className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
