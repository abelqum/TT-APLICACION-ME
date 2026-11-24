
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.*;
import com.gestionmicroempresas.backend.entidades.*;
import com.gestionmicroempresas.backend.repositorios.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

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

@Service
public class IngresosServicio {

    private static final BigDecimal LIMITE_IMPORTE =
            new BigDecimal("999999999999.99");

    private static final ZoneId ZONA_HORARIA =
            ZoneId.of("America/Mexico_City");

    private final IngresoRepositorio ingresoRepositorio;
    private final DetalleIngresoRepositorio detalleRepositorio;
    private final ClienteRepositorio clienteRepositorio;
    private final ContextoEmpresaServicio contextoEmpresaServicio;

    public IngresosServicio(
            IngresoRepositorio ingresoRepositorio,
            DetalleIngresoRepositorio detalleRepositorio,
            ClienteRepositorio clienteRepositorio,
            ContextoEmpresaServicio contextoEmpresaServicio
    ) {
        this.ingresoRepositorio = ingresoRepositorio;
        this.detalleRepositorio = detalleRepositorio;
        this.clienteRepositorio = clienteRepositorio;
        this.contextoEmpresaServicio = contextoEmpresaServicio;
    }

    // ==========================================
    // REGISTRAR INGRESO
    // ==========================================

    @Transactional
    public RespuestaIngreso registrarIngreso(
            Jwt jwt,
            SolicitudIngreso solicitud
    ) {

        // 1. Obtener usuario y empresa autenticados.

        Usuario usuario =
                contextoEmpresaServicio.obtenerUsuario(jwt);

        Empresa empresa = usuario.getEmpresa();

        Long empresaId = empresa.getId();

        // 2. Validar datos de pago y factura.

        validarDatosOperacion(solicitud);

        // 3. Obtener cliente, solo si hay factura.

        Cliente cliente = null;

        if (solicitud.tieneFactura()) {

            cliente = clienteRepositorio
                    .findByIdAndEmpresa_Id(
                            solicitud.clienteId(),
                            empresaId
                    )
                    .orElseThrow(
                            () -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "El cliente no existe en tu empresa."
                            )
                    );

            if (!cliente.isActivo()) {
                throw new IllegalArgumentException(
                        "El cliente seleccionado está inactivo."
                );
            }
        }

        // 4. Calcular todos los conceptos.

        List<ConceptoCalculado> conceptos =
                new ArrayList<>();

        BigDecimal subtotalGeneral =
                BigDecimal.ZERO.setScale(2);

        BigDecimal ivaGeneral =
                BigDecimal.ZERO.setScale(2);

        BigDecimal totalGeneral =
                BigDecimal.ZERO.setScale(2);

        boolean contieneProductos = false;

        for (SolicitudDetalleIngreso detalle
                : solicitud.detalles()) {
            CatalogoProductosTT1.validarProducto(detalle);
            if (detalle.tipoConcepto()
                    == TipoConceptoIngreso.PRODUCTO) {

                contieneProductos = true;
            }

            // El precio YA incluye IVA.

            BigDecimal total = detalle.cantidad()
                    .multiply(detalle.precioUnitario())
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );

            if (total.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "El importe de cada concepto debe ser mayor que cero."
                );
            }

            validarLimite(total);

            // Desglosar impuesto incluido.

            BigDecimal divisor = BigDecimal.ONE
                    .add(detalle.tasaIva());

            BigDecimal subtotal = total.divide(
                    divisor,
                    2,
                    RoundingMode.HALF_UP
            );

            BigDecimal iva = total.subtract(subtotal);

            conceptos.add(
                    new ConceptoCalculado(
                            detalle,
                            subtotal,
                            iva,
                            total
                    )
            );

            subtotalGeneral =
                    subtotalGeneral.add(subtotal);

            ivaGeneral =
                    ivaGeneral.add(iva);

            totalGeneral =
                    totalGeneral.add(total);
        }

        validarLimite(subtotalGeneral);
        validarLimite(ivaGeneral);
        validarLimite(totalGeneral);

        // 5. Determinar las fechas.

        LocalDate hoy = LocalDate.now(ZONA_HORARIA);

        // Sin factura: fecha del servidor.
        // Con factura: fecha capturada.

        LocalDate fecha = solicitud.tieneFactura()
                ? solicitud.fecha()
                : hoy;

        // Una venta comun se paga hoy.
        // Una factura pagada usa su fecha de pago.
        // Una factura pendiente queda sin fecha.

        LocalDate fechaPago;

        if (!solicitud.tieneFactura()) {

            fechaPago = hoy;

        } else if (
                solicitud.estadoPago() == EstadoPagoIngreso.PAGADO
        ) {

            fechaPago = solicitud.fechaPago();

        } else {

            fechaPago = null;
        }

        // 6. Crear encabezado.

        Ingreso ingreso = new Ingreso(
                empresa,
                usuario,
                cliente,

                fecha,

                subtotalGeneral,
                ivaGeneral,
                totalGeneral,

                solicitud.estadoPago(),
                solicitud.metodoPago(),

                solicitud.tieneFactura(),

                limpiar(solicitud.numeroFactura()),
                limpiar(solicitud.uuidFiscal()),
                limpiar(solicitud.observaciones()),

                contieneProductos,

                fechaPago
        );

        // 7. Guardar encabezado.
        // La base de datos genera el folio.

        ingreso = ingresoRepositorio.saveAndFlush(ingreso);

        // 8. Crear detalles.

        List<DetalleIngreso> detalles =
                new ArrayList<>();

        for (ConceptoCalculado calculado : conceptos) {

            SolicitudDetalleIngreso dato =
                    calculado.solicitud();

            DetalleIngreso detalle = new DetalleIngreso(
                    empresa,
                    ingreso,

                    // No existe Inventario en TT1.
                    null,

                    dato.tipoConcepto(),

                    limpiar(dato.claveArticulo()),
                    dato.concepto().trim(),
                    dato.unidadMedida().trim(),

                    dato.cantidad(),
                    dato.precioUnitario(),
                    dato.tasaIva(),

                    calculado.subtotal(),
                    calculado.iva(),
                    calculado.total()
            );

            detalles.add(detalle);
        }

        // 9. Guardar detalles en la misma transaccion.

        List<DetalleIngreso> guardados =
                detalleRepositorio.saveAllAndFlush(detalles);

        // 10. Construir respuesta.

        return construirRespuesta(ingreso, guardados);
    }

    // ==========================================
    // HISTORIAL PAGINADO
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ResumenIngreso> listarIngresos(
            Jwt jwt,
            int pagina,
            int tamano
    ) {

        Usuario usuario =
                contextoEmpresaServicio.obtenerUsuario(jwt);

        if (pagina < 0) {
            throw new IllegalArgumentException(
                    "La página no puede ser negativa."
            );
        }

        if (tamano < 1 || tamano > 50) {
            throw new IllegalArgumentException(
                    "El tamaño debe estar entre 1 y 50."
            );
        }

        Long empresaId = usuario.getEmpresa().getId();

        Page<Ingreso> ingresos = ingresoRepositorio
                .findAllByEmpresa_IdOrderByFechaDescIdDesc(
                        empresaId,
                        PageRequest.of(pagina, tamano)
                );

        return ingresos.map(ResumenIngreso::desde);
    }

    // ==========================================
    // CONSULTAR DETALLE DE UN INGRESO
    // ==========================================

    @Transactional(readOnly = true)
    public RespuestaIngreso consultarIngreso(
            Jwt jwt,
            Long ingresoId
    ) {

        Usuario usuario =
                contextoEmpresaServicio.obtenerUsuario(jwt);

        Long empresaId = usuario.getEmpresa().getId();

        Ingreso ingreso = ingresoRepositorio
                .findByIdAndEmpresa_Id(
                        ingresoId,
                        empresaId
                )
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No se encontró el ingreso."
                        )
                );

        List<DetalleIngreso> detalles =
                detalleRepositorio
                        .findAllByEmpresa_IdAndIngreso_IdOrderByIdAsc(
                                empresaId,
                                ingresoId
                        );

        return construirRespuesta(ingreso, detalles);
    }

    // ==========================================
    // VALIDACIONES DE LA OPERACION
    // ==========================================

    private void validarDatosOperacion(
            SolicitudIngreso solicitud
    ) {

        // Pago completo.

        if (
                solicitud.estadoPago() == EstadoPagoIngreso.PAGADO
                        && solicitud.metodoPago() == null
        ) {
            throw new IllegalArgumentException(
                    "Selecciona el método de pago."
            );
        }

        // Pago pendiente.

        if (
                solicitud.estadoPago() == EstadoPagoIngreso.PENDIENTE
                        && solicitud.metodoPago() != null
        ) {
            throw new IllegalArgumentException(
                    "Un ingreso pendiente no debe tener método de pago."
            );
        }

        String numeroFactura =
                limpiar(solicitud.numeroFactura());

        String uuidFiscal =
                limpiar(solicitud.uuidFiscal());

        // ======================================
        // SIN FACTURA
        // ======================================

        if (!solicitud.tieneFactura()) {

            if (
                    solicitud.clienteId() != null
                            || numeroFactura != null
                            || uuidFiscal != null
            ) {
                throw new IllegalArgumentException(
                        "Una venta sin factura debe usar Público en general."
                );
            }

            if (
                    solicitud.estadoPago()
                            != EstadoPagoIngreso.PAGADO
            ) {
                throw new IllegalArgumentException(
                        "Las ventas sin factura se registran como pagadas."
                );
            }

            return;
        }

        // ======================================
        // CON FACTURA
        // ======================================

        if (solicitud.clienteId() == null) {
            throw new IllegalArgumentException(
                    "Selecciona el cliente de la factura."
            );
        }

        if (numeroFactura == null) {
            throw new IllegalArgumentException(
                    "Ingresa el número de factura."
            );
        }

        if (solicitud.fecha() == null) {
            throw new IllegalArgumentException(
                    "La fecha de factura es obligatoria."
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
                    "Una factura pendiente no debe tener fecha de pago."
            );
        }
    }

    // ==========================================
    // VALIDACION DEL LIMITE MONETARIO
    // ==========================================

    private void validarLimite(
            BigDecimal importe
    ) {

        if (importe.compareTo(LIMITE_IMPORTE) > 0) {
            throw new IllegalArgumentException(
                    "El importe supera el límite permitido."
            );
        }
    }

    // ==========================================
    // LIMPIEZA DE TEXTOS OPCIONALES
    // ==========================================

    private String limpiar(
            String valor
    ) {

        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }

    // ==========================================
    // RESPUESTA COMPLETA DEL INGRESO
    // ==========================================

    private RespuestaIngreso construirRespuesta(
            Ingreso ingreso,
            List<DetalleIngreso> detalles
    ) {

        List<RespuestaDetalleIngreso> respuestas =
                detalles.stream()
                        .map(RespuestaDetalleIngreso::desde)
                        .toList();

        return new RespuestaIngreso(
                ResumenIngreso.desde(ingreso),
                respuestas
        );
    }

    // ==========================================
    // ESTRUCTURA INTERNA PARA CALCULOS
    // ==========================================

    private record ConceptoCalculado(
            SolicitudDetalleIngreso solicitud,
            BigDecimal subtotal,
            BigDecimal iva,
            BigDecimal total
    ) {
    }
}
