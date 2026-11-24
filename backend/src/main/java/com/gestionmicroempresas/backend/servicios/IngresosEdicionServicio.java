
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.*;
import com.gestionmicroempresas.backend.entidades.*;
import com.gestionmicroempresas.backend.repositorios.*;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.time.LocalDate;
import java.time.ZoneId;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class IngresosEdicionServicio {

    private static final ZoneId ZONA =
            ZoneId.of("America/Mexico_City");

    private static final BigDecimal MAXIMO =
            new BigDecimal("999999999999.99");

    private final ContextoEmpresaServicio contexto;
    private final IngresoRepositorio ingresos;
    private final DetalleIngresoRepositorio detalles;
    private final ClienteRepositorio clientes;

    public IngresosEdicionServicio(
            ContextoEmpresaServicio contexto,
            IngresoRepositorio ingresos,
            DetalleIngresoRepositorio detalles,
            ClienteRepositorio clientes
    ) {
        this.contexto = contexto;
        this.ingresos = ingresos;
        this.detalles = detalles;
        this.clientes = clientes;
    }

    // ==========================================
    // ACTUALIZAR INGRESO
    // ==========================================

    @Transactional
    public RespuestaIngreso actualizar(
            Jwt jwt,
            Long ingresoId,
            SolicitudIngreso solicitud
    ) {

        Long empresaId = contexto
                .obtenerUsuario(jwt)
                .getEmpresa()
                .getId();

        Ingreso ingreso = buscarIngreso(
                empresaId,
                ingresoId
        );

        comprobarEditable(ingreso);
        validarOperacion(solicitud);

        // ======================================
        // CLIENTE
        // ======================================

        Cliente cliente = null;

        if (solicitud.tieneFactura()) {

            cliente = clientes
                    .findByIdAndEmpresa_Id(
                            solicitud.clienteId(),
                            empresaId
                    )
                    .orElseThrow(
                            () -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "El cliente no pertenece a tu empresa."
                            )
                    );

            if (!cliente.isActivo()) {
                throw new IllegalArgumentException(
                        "El cliente está inactivo."
                );
            }
        }

        // ======================================
        // DETALLES ANTERIORES
        // ======================================

        List<DetalleIngreso> anteriores = detalles
                .findAllByEmpresa_IdAndIngreso_IdOrderByIdAsc(
                        empresaId,
                        ingresoId
                );

        List<Linea> calculadas = new ArrayList<>();

        BigDecimal subtotal =
                BigDecimal.ZERO.setScale(2);

        BigDecimal iva =
                BigDecimal.ZERO.setScale(2);

        BigDecimal total =
                BigDecimal.ZERO.setScale(2);

        boolean contieneProductos = false;

        // ======================================
        // CALCULAR CONCEPTOS
        // ======================================

        for (SolicitudDetalleIngreso dato
                : solicitud.detalles()) {

            if (dato.tipoConcepto()
                    == TipoConceptoIngreso.PRODUCTO) {

                contieneProductos = true;

                // Los productos existentes pueden
                // conservar su precio historico.

                boolean productoConservado = anteriores
                        .stream()
                        .anyMatch(original ->
                                original.getTipoConcepto()
                                        == TipoConceptoIngreso.PRODUCTO

                                        && Objects.equals(
                                        original.getClaveArticulo(),
                                        limpiar(dato.claveArticulo())
                                )

                                        && original.getConcepto().equals(
                                        dato.concepto().trim()
                                )

                                        && original.getUnidadMedida().equals(
                                        dato.unidadMedida().trim()
                                )

                                        && original.getPrecioUnitario()
                                        .compareTo(
                                                dato.precioUnitario()
                                        ) == 0

                                        && original.getTasaIva()
                                        .compareTo(
                                                dato.tasaIva()
                                        ) == 0
                        );

                // Un producto NUEVO debe pertenecer
                // al catalogo fijo del prototipo TT1.

                if (!productoConservado) {
                    CatalogoProductosTT1.validarProducto(dato);
                }
            }

            // Precio unitario con IVA incluido.

            BigDecimal totalLinea = dato.cantidad()
                    .multiply(dato.precioUnitario())
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );

            if (
                    totalLinea.signum() <= 0
                            || totalLinea.compareTo(MAXIMO) > 0
            ) {
                throw new IllegalArgumentException(
                        "Importe inválido en un concepto."
                );
            }

            BigDecimal subtotalLinea = totalLinea.divide(
                    BigDecimal.ONE.add(dato.tasaIva()),
                    2,
                    RoundingMode.HALF_UP
            );

            BigDecimal ivaLinea =
                    totalLinea.subtract(subtotalLinea);

            calculadas.add(
                    new Linea(
                            dato,
                            subtotalLinea,
                            ivaLinea,
                            totalLinea
                    )
            );

            subtotal = subtotal.add(subtotalLinea);
            iva = iva.add(ivaLinea);
            total = total.add(totalLinea);
        }

        if (
                total.signum() <= 0
                        || total.compareTo(MAXIMO) > 0
                        || subtotal.compareTo(MAXIMO) > 0
                        || iva.compareTo(MAXIMO) > 0
        ) {
            throw new IllegalArgumentException(
                    "El importe de la operación está fuera de rango."
            );
        }

        // ======================================
        // FECHAS
        // ======================================

        // Venta normal: conserva su fecha historica.
        // Factura: permite corregir la fecha.

        LocalDate fecha = solicitud.tieneFactura()
                ? solicitud.fecha()
                : ingreso.getFecha();

        LocalDate fechaPago = solicitud.tieneFactura()
                ? solicitud.fechaPago()
                : (
                ingreso.getFechaPago() == null
                ? LocalDate.now(ZONA)
                : ingreso.getFechaPago()
        );

        // ======================================
        // ACTUALIZAR ENCABEZADO
        // ======================================

        ingreso.actualizarDatos(
                cliente,
                fecha,
                fechaPago,
                subtotal,
                iva,
                total,
                solicitud.estadoPago(),
                solicitud.metodoPago(),
                solicitud.tieneFactura(),
                limpiar(solicitud.numeroFactura()),
                limpiar(solicitud.uuidFiscal()),
                limpiar(solicitud.observaciones()),
                contieneProductos
        );

        ingresos.saveAndFlush(ingreso);

        // ======================================
        // REEMPLAZAR DETALLES
        // ======================================

        detalles.eliminarPorIngreso(
                empresaId,
                ingresoId
        );

        List<DetalleIngreso> nuevos =
                new ArrayList<>();

        for (Linea linea : calculadas) {

            SolicitudDetalleIngreso dato =
                    linea.solicitud();

            nuevos.add(
                    new DetalleIngreso(
                            ingreso.getEmpresa(),
                            ingreso,

                            // Inventario aun no existe.
                            null,

                            dato.tipoConcepto(),
                            limpiar(dato.claveArticulo()),
                            dato.concepto().trim(),
                            dato.unidadMedida().trim(),
                            dato.cantidad(),
                            dato.precioUnitario(),
                            dato.tasaIva(),

                            linea.subtotal(),
                            linea.iva(),
                            linea.total()
                    )
            );
        }

        List<DetalleIngreso> guardados =
                detalles.saveAllAndFlush(nuevos);

        return construirRespuesta(
                ingreso,
                guardados
        );
    }

    // ==========================================
    // CANCELAR SIN BORRAR
    // ==========================================

    @Transactional
    public RespuestaIngreso cancelar(
            Jwt jwt,
            Long ingresoId
    ) {

        Long empresaId = contexto
                .obtenerUsuario(jwt)
                .getEmpresa()
                .getId();

        Ingreso ingreso = buscarIngreso(
                empresaId,
                ingresoId
        );

        comprobarEditable(ingreso);

        ingreso.cancelar();

        ingresos.saveAndFlush(ingreso);

        List<DetalleIngreso> conceptos = detalles
                .findAllByEmpresa_IdAndIngreso_IdOrderByIdAsc(
                        empresaId,
                        ingresoId
                );

        return construirRespuesta(
                ingreso,
                conceptos
        );
    }

    // ==========================================
    // BUSCAR OPERACION DE LA EMPRESA
    // ==========================================

    private Ingreso buscarIngreso(
            Long empresaId,
            Long ingresoId
    ) {

        return ingresos
                .findByIdAndEmpresa_Id(
                        ingresoId,
                        empresaId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No se encontró el ingreso en tu empresa."
                        )
                );
    }

    // ==========================================
    // REGLAS DE MODIFICACION
    // ==========================================

    private void comprobarEditable(
            Ingreso ingreso
    ) {

        if (
                ingreso.getEstado()
                        == EstadoIngreso.CANCELADO
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Un ingreso cancelado no puede modificarse."
            );
        }

        if (
                ingreso.getEstadoIntegracionInventario()
                        == EstadoIntegracionInventario.APLICADO
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esta operación ya modificó inventario " +
                            "y requiere un ajuste controlado."
            );
        }
    }

    // ==========================================
    // VALIDAR PAGO Y FACTURA
    // ==========================================

    private void validarOperacion(
            SolicitudIngreso solicitud
    ) {

        if (solicitud.estadoPago() == null) {
            throw new IllegalArgumentException(
                    "Indica el estado de pago."
            );
        }

        if (
                solicitud.estadoPago() == EstadoPagoIngreso.PAGADO
                        && solicitud.metodoPago() == null
        ) {
            throw new IllegalArgumentException(
                    "Selecciona un método de pago."
            );
        }

        if (
                solicitud.estadoPago() == EstadoPagoIngreso.PENDIENTE
                        && solicitud.metodoPago() != null
        ) {
            throw new IllegalArgumentException(
                    "Una operación pendiente no tiene método de pago."
            );
        }

        if (!solicitud.tieneFactura()) {

            if (
                    solicitud.clienteId() != null
                            || limpiar(solicitud.numeroFactura()) != null
                            || limpiar(solicitud.uuidFiscal()) != null
                            || solicitud.estadoPago()
                            != EstadoPagoIngreso.PAGADO
            ) {
                throw new IllegalArgumentException(
                        "Sin factura debe registrarse como " +
                                "Público en general y pagado."
                );
            }

        } else {

            if (
                    solicitud.clienteId() == null
                            || limpiar(solicitud.numeroFactura()) == null
                            || solicitud.fecha() == null
            ) {
                throw new IllegalArgumentException(
                        "Completa cliente, número y fecha de factura."
                );
            }

            if (
                    solicitud.estadoPago() == EstadoPagoIngreso.PAGADO
                            && solicitud.fechaPago() == null
            ) {
                throw new IllegalArgumentException(
                        "Indica la fecha de pago."
                );
            }

            if (
                    solicitud.estadoPago() == EstadoPagoIngreso.PENDIENTE
                            && solicitud.fechaPago() != null
            ) {
                throw new IllegalArgumentException(
                        "La factura pendiente no debe tener fecha de pago."
                );
            }
        }
    }

    // ==========================================
    // CONSTRUIR RESPUESTA
    // ==========================================

    private RespuestaIngreso construirRespuesta(
            Ingreso ingreso,
            List<DetalleIngreso> conceptos
    ) {

        return new RespuestaIngreso(
                ResumenIngreso.desde(ingreso),

                conceptos.stream()
                        .map(RespuestaDetalleIngreso::desde)
                        .toList()
        );
    }

    private String limpiar(
            String valor
    ) {

        return valor == null || valor.isBlank()
                ? null
                : valor.trim();
    }

    private record Linea(
            SolicitudDetalleIngreso solicitud,
            BigDecimal subtotal,
            BigDecimal iva,
            BigDecimal total
    ) {
    }
}
