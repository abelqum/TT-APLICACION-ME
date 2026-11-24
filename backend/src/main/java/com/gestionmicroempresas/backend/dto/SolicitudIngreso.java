
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.EstadoPagoIngreso;
import com.gestionmicroempresas.backend.entidades.MetodoPagoIngreso;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record SolicitudIngreso(

        // NULL representa Publico en general.
        Long clienteId,

        // Fecha de factura, cuando corresponda.
        // Sin factura, el servidor determina la fecha.
        LocalDate fecha,

        // NULL si el ingreso esta pendiente.
        LocalDate fechaPago,

        @NotNull(
                message = "El estado de pago es obligatorio."
        )
        EstadoPagoIngreso estadoPago,

        MetodoPagoIngreso metodoPago,

        boolean tieneFactura,

        @Size(max = 100)
        String numeroFactura,

        @Size(max = 36)
        String uuidFiscal,

        @Size(max = 1000)
        String observaciones,

        @NotEmpty(
                message = "Agrega al menos un concepto."
        )
        @Size(
                max = 100,
                message = "La orden admite hasta 100 conceptos."
        )
        List<
                @NotNull
                @Valid SolicitudDetalleIngreso
                > detalles

) {
}
