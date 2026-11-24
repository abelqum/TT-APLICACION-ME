"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import {
  X,
  Search,
  Plus,
  Trash2,
  ScanLine,
  ShoppingCart,
  Package,
  Wrench,
  FileText,
} from "lucide-react";

import BuscadorClientes from "@/componentes/ingresos/BuscadorClientes";

import { servicioIngresos } from "@/servicios/servicioIngresos";

import {
  mostrarMensajeGestion,
  obtenerMensajeErrorGestion,
} from "@/lib/alertas";

// ==========================================
// PRODUCTOS DE DEMOSTRACION PARA TT1
// ==========================================

// En TT2 se reemplazarán por el catálogo
// del módulo de Inventario.
// Sus precios finales ya incluyen IVA.

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
  tasaIva: "0.16",
};

const LIMITE_CENTAVOS = 99999999999999n;

// ==========================================
// UTILIDADES
// ==========================================

function hoy() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function moneda(centavos) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(centavos) / 100);
}

function decimal(valor, decimales) {
  const texto = String(valor ?? "").trim();

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return null;
  }

  const [entero, fraccion = ""] = texto.split(".");

  if (fraccion.length > decimales) {
    return null;
  }

  return (
    BigInt(entero) * 10n ** BigInt(decimales) +
    BigInt(fraccion.padEnd(decimales, "0") || "0")
  );
}

function valido(valor, enteros, decimales) {
  const texto = String(valor ?? "");

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return false;
  }

  const [parteEntera, fraccion = ""] = texto.split(".");

  return (
    parteEntera.length <= enteros &&
    fraccion.length <= decimales &&
    Number(texto) > 0
  );
}

// El cálculo visual utiliza enteros.
// Spring Boot recalcula con BigDecimal.

function calcular(item) {
  const cantidad = decimal(item.cantidad, 3);

  const precio = decimal(item.precioUnitario, 2);

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
    subtotal,
    iva: total - subtotal,
    total,
  };
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function FormularioIngreso({ alRegistrar, alCancelar }) {
  const dialogoRef = useRef(null);
  const contadorRef = useRef(0);

  // ========================================
  // PRODUCTOS Y SERVICIOS
  // ========================================

  const [tipo, setTipo] = useState("PRODUCTO");

  const [carrito, setCarrito] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  const [servicio, setServicio] = useState(SERVICIO_INICIAL);

  // ========================================
  // FACTURACION
  // ========================================

  const [clienteId, setClienteId] = useState("");

  const [tieneFactura, setTieneFactura] = useState(false);

  const [numeroFactura, setNumeroFactura] = useState("");

  const [uuidFiscal, setUuidFiscal] = useState("");

  const [fechaFactura, setFechaFactura] = useState(hoy);

  const [fechaPago, setFechaPago] = useState(hoy);

  const [estadoPago, setEstadoPago] = useState("PAGADO");

  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);

  // ========================================
  // ABRIR MODAL
  // ========================================

  useEffect(() => {
    const dialogo = dialogoRef.current;

    if (dialogo && !dialogo.open) {
      dialogo.showModal();
    }

    return () => {
      if (dialogo?.open) {
        dialogo.close();
      }
    };
  }, []);

  function cerrar() {
    if (!guardando) {
      alCancelar?.();
    }
  }

  // ========================================
  // AGREGAR PRODUCTO
  // ========================================

  function agregarProducto(producto) {
    const nuevoId = ++contadorRef.current;

    setCarrito((lista) => {
      const existente = lista.find(
        (item) =>
          item.tipoConcepto === "PRODUCTO" &&
          item.claveArticulo === producto.claveArticulo,
      );

      if (existente) {
        return lista.map((item) =>
          item.idLocal === existente.idLocal
            ? {
                ...item,
                cantidad: String(Number(item.cantidad) + 1),
              }
            : item,
        );
      }

      return [
        ...lista,
        {
          ...producto,
          idLocal: nuevoId,
          tipoConcepto: "PRODUCTO",
          cantidad: "1",
        },
      ];
    });

    setBusqueda("");
    setProductoSeleccionado("");
  }

  function agregarSeleccionado() {
    const producto = PRODUCTOS_DEMO.find(
      (item) => item.claveArticulo === productoSeleccionado,
    );

    if (producto) {
      agregarProducto(producto);
    }
  }

  // ========================================
  // AGREGAR SERVICIO
  // ========================================

  async function agregarServicio() {
    const item = {
      ...servicio,
      tipoConcepto: "SERVICIO",
      unidadMedida: "SERVICIO",
    };

    const calculo = calcular(item);

    if (
      !servicio.concepto.trim() ||
      servicio.concepto.length > 200 ||
      !valido(servicio.cantidad, 9, 3) ||
      !valido(servicio.precioUnitario, 12, 2) ||
      calculo.total <= 0n ||
      calculo.total > LIMITE_CENTAVOS
    ) {
      await mostrarMensajeGestion(
        "Datos incorrectos",
        "Captura descripción, cantidad y precio válidos.",
        "warning",
      );

      return;
    }

    const nuevoId = ++contadorRef.current;

    setCarrito((lista) => [
      ...lista,
      {
        ...item,
        idLocal: nuevoId,
        concepto: item.concepto.trim(),
        claveArticulo: null,
      },
    ]);

    setServicio({
      ...SERVICIO_INICIAL,
    });
  }

  // ========================================
  // BUSCADOR DE PRODUCTOS
  // ========================================

  const filtrados = PRODUCTOS_DEMO.filter((producto) => {
    const texto = busqueda.trim().toLowerCase();

    return (
      producto.concepto.toLowerCase().includes(texto) ||
      producto.claveArticulo.toLowerCase().includes(texto)
    );
  });

  // ========================================
  // RESUMEN
  // ========================================

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

  // ========================================
  // FACTURA
  // ========================================

  function activarFactura(valor) {
    setTieneFactura(valor);

    if (!valor) {
      setClienteId("");
      setNumeroFactura("");
      setUuidFiscal("");

      setEstadoPago("PAGADO");
      setMetodoPago("EFECTIVO");
    }
  }

  // ========================================
  // GUARDAR INGRESO
  // ========================================

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    const conceptosInvalidos =
      carrito.length < 1 ||
      carrito.length > 100 ||
      carrito.some((item) => {
        const calculo = calcular(item);

        return (
          !valido(item.cantidad, 9, 3) ||
          !valido(item.precioUnitario, 12, 2) ||
          calculo.total <= 0n ||
          calculo.total > LIMITE_CENTAVOS
        );
      }) ||
      resumen.total <= 0n ||
      resumen.total > LIMITE_CENTAVOS;

    if (conceptosInvalidos) {
      await mostrarMensajeGestion(
        "Revisa la orden",
        "Verifica cantidades e importes de todos los conceptos.",
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
        "Selecciona cliente, número y fechas requeridas.",
        "warning",
      );

      return;
    }

    const datos = {
      // Sin factura, la fecha se calcula
      // en Spring Boot.

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

        concepto: item.concepto,

        unidadMedida: item.unidadMedida,

        cantidad: item.cantidad,

        precioUnitario: item.precioUnitario,

        tasaIva: item.tasaIva,
      })),
    };

    setGuardando(true);

    try {
      const resultado = await servicioIngresos.registrar(datos);

      await mostrarMensajeGestion(
        "Ingreso registrado",
        `Se guardó ${resultado.ingreso?.folio ?? "la operación"}.`,
      );

      alRegistrar?.(resultado);
    } catch (excepcion) {
      await mostrarMensajeGestion(
        "No se pudo registrar",
        obtenerMensajeErrorGestion(excepcion),
        "error",
      );
    } finally {
      setGuardando(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-600";

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="titulo-nuevo-ingreso"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
      className="m-auto max-h-[94dvh] w-[min(96vw,1020px)] rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
    >
      <form onSubmit={guardar} className="flex max-h-[94dvh] flex-col">
        {/* ENCABEZADO */}

        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="titulo-nuevo-ingreso" className="text-xl font-bold">
              Nuevo ingreso
            </h2>

            <p className="text-xs text-slate-500">
              Captura de productos y servicios · TT1
            </p>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={cerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </header>

        {/* CONTENIDO DESPLAZABLE */}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* TIPO DE CONCEPTO */}

          <section className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              1. Agregar conceptos
            </h3>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {[
                ["PRODUCTO", Package, "Producto"],
                ["SERVICIO", Wrench, "Servicio"],
              ].map(([clave, Icono, titulo]) => (
                <button
                  type="button"
                  key={clave}
                  onClick={() => setTipo(clave)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
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

            {/* PRODUCTOS */}

            {tipo === "PRODUCTO" ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    placeholder="Buscar producto por nombre o clave"
                    className={`${input} pl-10`}
                  />
                </div>

                {/* RESULTADOS DE BUSQUEDA */}

                {busqueda.trim() && (
                  <div className="space-y-1 rounded-lg bg-slate-50 p-2">
                    {filtrados.length ? (
                      filtrados.map((producto) => (
                        <button
                          type="button"
                          key={producto.claveArticulo}
                          onClick={() => agregarProducto(producto)}
                          className="flex w-full justify-between rounded-lg bg-white p-3 text-left text-sm hover:bg-blue-50"
                        >
                          <span>
                            {producto.concepto}

                            <small className="ml-2 text-slate-500">
                              {producto.claveArticulo}
                            </small>
                          </span>

                          <strong>
                            {moneda(decimal(producto.precioUnitario, 2))}
                          </strong>
                        </button>
                      ))
                    ) : (
                      <p className="p-2 text-xs text-slate-500">
                        Sin resultados
                      </p>
                    )}
                  </div>
                )}

                {/* SELECTOR */}

                <div className="flex flex-wrap gap-2">
                  <select
                    value={productoSeleccionado}
                    onChange={(evento) =>
                      setProductoSeleccionado(evento.target.value)
                    }
                    className={`${input} min-w-0 flex-1`}
                  >
                    <option value="">Seleccionar producto...</option>

                    {PRODUCTOS_DEMO.map((producto) => (
                      <option
                        key={producto.claveArticulo}
                        value={producto.claveArticulo}
                      >
                        {producto.concepto}

                        {" · "}

                        {producto.claveArticulo}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!productoSeleccionado}
                    onClick={agregarSeleccionado}
                    className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                  >
                    <Plus size={17} />
                    Agregar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      mostrarMensajeGestion(
                        "Escáner QR",
                        "Se conectará al Inventario real en TT2.",
                        "info",
                      )
                    }
                    className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
                  >
                    <ScanLine size={17} />
                    QR
                  </button>
                </div>

                <p className="text-xs text-amber-700">
                  Precios no editables, de demostración en TT1. No se descuenta
                  inventario.
                </p>
              </div>
            ) : (
              /* SERVICIOS */

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <label className="block space-y-1">
                  <span className="text-sm">Descripción del servicio</span>

                  <input
                    maxLength={200}
                    value={servicio.concepto}
                    onChange={(evento) =>
                      setServicio((actual) => ({
                        ...actual,
                        concepto: evento.target.value,
                      }))
                    }
                    className={input}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-sm">Cantidad</span>

                    <input
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
                      className={input}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm">Precio final</span>

                    <input
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
                      className={input}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm">IVA incluido</span>

                    <select
                      value={servicio.tasaIva}
                      onChange={(evento) =>
                        setServicio((actual) => ({
                          ...actual,
                          tasaIva: evento.target.value,
                        }))
                      }
                      className={input}
                    >
                      <option value="0.16">16 %</option>

                      <option value="0">0 %</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={agregarServicio}
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white"
                >
                  <Plus size={18} />
                  Agregar servicio
                </button>
              </div>
            )}
          </section>

          {/* ORDEN ACTUAL */}

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <ShoppingCart size={19} />
              2. Orden actual ({carrito.length})
            </h3>

            {carrito.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-7 text-center text-sm text-slate-500">
                Agrega un producto o servicio
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[570px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3">Concepto</th>

                      <th className="p-3">Cantidad</th>

                      <th className="p-3">Precio unitario</th>

                      <th className="p-3">Total</th>

                      <th className="p-3">Quitar</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {carrito.map((item) => (
                      <tr key={item.idLocal}>
                        <td className="p-3">
                          <strong>{item.concepto}</strong>

                          <p className="text-xs text-slate-500">
                            {item.tipoConcepto} {item.claveArticulo || ""}
                          </p>
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            aria-label={`Cantidad de ${item.concepto}`}
                            value={item.cantidad}
                            onChange={(evento) => {
                              setCarrito((lista) =>
                                lista.map((concepto) =>
                                  concepto.idLocal === item.idLocal
                                    ? {
                                        ...concepto,
                                        cantidad: evento.target.value,
                                      }
                                    : concepto,
                                ),
                              );
                            }}
                            className="w-24 rounded-lg border p-2"
                          />
                        </td>

                        <td className="p-3">
                          <span>
                            {moneda(decimal(item.precioUnitario, 2) ?? 0n)}
                          </span>

                          <p className="text-xs text-slate-400">Solo lectura</p>
                        </td>

                        <td className="p-3 font-bold">
                          {moneda(calcular(item).total)}
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            aria-label={`Quitar ${item.concepto}`}
                            onClick={() =>
                              setCarrito((lista) =>
                                lista.filter(
                                  (concepto) =>
                                    concepto.idLocal !== item.idLocal,
                                ),
                              )
                            }
                            className="p-2 text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* RESUMEN */}

            <div className="ml-auto max-w-xs space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>{moneda(resumen.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>IVA incluido</span>

                <span>{moneda(resumen.iva)}</span>
              </div>

              <div className="flex justify-between border-t pt-2 text-lg font-black">
                <span>Total</span>

                <span>{moneda(resumen.total)}</span>
              </div>
            </div>
          </section>

          {/* DATOS DE LA OPERACION */}

          <section className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="font-semibold">3. Datos del ingreso</h3>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Fecha y hora</p>

                <strong>Automática al registrar</strong>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Cliente</p>

                <strong>
                  {tieneFactura ? "Cliente de factura" : "Público en general"}
                </strong>
              </div>
            </div>

            {(!tieneFactura || estadoPago === "PAGADO") && (
              <label className="block space-y-1">
                <span className="text-sm">Método de pago</span>

                <select
                  value={metodoPago}
                  onChange={(evento) => setMetodoPago(evento.target.value)}
                  className={input}
                >
                  <option value="EFECTIVO">Efectivo</option>

                  <option value="TRANSFERENCIA">Transferencia</option>

                  <option value="TARJETA_DEBITO">Tarjeta de débito</option>

                  <option value="TARJETA_CREDITO">Tarjeta de crédito</option>

                  <option value="OTRO">Otro</option>
                </select>
              </label>
            )}
          </section>

          {/* FACTURA EXTERNA */}

          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 font-bold">
              <span className="flex items-center gap-2">
                <FileText size={19} />
                Factura externa
              </span>

              <input
                role="switch"
                type="checkbox"
                checked={tieneFactura}
                onChange={(evento) => activarFactura(evento.target.checked)}
                className="h-5 w-5 accent-blue-700"
              />
            </label>

            <p className="text-xs text-slate-500">
              Al activarla se agregan los datos de una factura emitida fuera de
              la aplicación. El total no cambia.
            </p>

            {tieneFactura && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                {/* BUSCADOR DE CLIENTES */}

                <div>
                  <span className="mb-2 block text-sm font-semibold">
                    Cliente de factura *
                  </span>

                  <BuscadorClientes
                    requerido
                    valor={clienteId}
                    alCambiar={(id) => setClienteId(id)}
                  />

                  <Link
                    href="/dashboard/clientes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-blue-700 underline"
                  >
                    Registrar cliente en otra pestaña
                  </Link>
                </div>

                {/* CAMPOS DE FACTURA */}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm">Número de factura *</span>

                    <input
                      required
                      maxLength={100}
                      value={numeroFactura}
                      onChange={(evento) =>
                        setNumeroFactura(evento.target.value)
                      }
                      className={input}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm">Fecha de factura *</span>

                    <input
                      required
                      type="date"
                      value={fechaFactura}
                      onChange={(evento) =>
                        setFechaFactura(evento.target.value)
                      }
                      className={input}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm">UUID (opcional)</span>

                    <input
                      maxLength={36}
                      value={uuidFiscal}
                      onChange={(evento) => setUuidFiscal(evento.target.value)}
                      className={input}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm">Estado de pago</span>

                    <select
                      value={estadoPago}
                      onChange={(evento) => {
                        const estado = evento.target.value;

                        setEstadoPago(estado);

                        setMetodoPago(estado === "PENDIENTE" ? "" : "EFECTIVO");
                      }}
                      className={input}
                    >
                      <option value="PAGADO">Pagado</option>

                      <option value="PENDIENTE">Pendiente</option>
                    </select>
                  </label>

                  {estadoPago === "PAGADO" && (
                    <label className="space-y-1">
                      <span className="text-sm">Fecha de pago *</span>

                      <input
                        required
                        type="date"
                        value={fechaPago}
                        onChange={(evento) => setFechaPago(evento.target.value)}
                        className={input}
                      />
                    </label>
                  )}
                </div>

                {/* IMPORTE DE LA FACTURA */}

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs text-blue-700">Monto (solo lectura)</p>

                  <strong className="text-lg text-blue-900">
                    {moneda(resumen.total)}
                  </strong>
                </div>
              </div>
            )}
          </section>

          {/* OBSERVACIONES */}

          <label className="block space-y-1">
            <span className="text-sm">Observaciones (opcional)</span>

            <textarea
              maxLength={1000}
              rows={2}
              value={observaciones}
              onChange={(evento) => setObservaciones(evento.target.value)}
              className={input}
            />
          </label>
        </div>

        {/* PIE FIJO DEL MODAL */}

        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs text-slate-500">Total de la orden</p>

            <strong className="text-xl">{moneda(resumen.total)}</strong>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={guardando}
              onClick={cerrar}
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando || !carrito.length}
              className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {guardando ? "Registrando..." : "Registrar ingreso"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
