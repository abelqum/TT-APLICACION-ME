
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.Cliente;
import com.gestionmicroempresas.backend.entidades.EstadoIngreso;
import com.gestionmicroempresas.backend.entidades.EstadoIntegracionInventario;
import com.gestionmicroempresas.backend.entidades.EstadoPagoIngreso;
import com.gestionmicroempresas.backend.entidades.Ingreso;
import com.gestionmicroempresas.backend.entidades.MetodoPagoIngreso;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ResumenIngreso(

        Long id,
        String folio,

        LocalDate fecha,
        LocalDate fechaPago,

        Long clienteId,
        String clienteNombre,

        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total,

        EstadoPagoIngreso estadoPago,
        MetodoPagoIngreso metodoPago,

        boolean tieneFactura,

        String numeroFactura,
        String uuidFiscal,
        String observaciones,

        EstadoIngreso estado,

        EstadoIntegracionInventario estadoIntegracionInventario,

        String registradoPor,

        OffsetDateTime creadoEn

) {

    public static ResumenIngreso desde(
            Ingreso ingreso
    ) {

        Cliente cliente = ingreso.getCliente();

        return new ResumenIngreso(
                ingreso.getId(),
                ingreso.getFolio(),

                ingreso.getFecha(),
                ingreso.getFechaPago(),

                cliente == null
                        ? null
                        : cliente.getId(),

                cliente == null
                        ? "Público en general"
                        : cliente.getNombre(),

                ingreso.getSubtotal(),
                ingreso.getIva(),
                ingreso.getTotal(),

                ingreso.getEstadoPago(),
                ingreso.getMetodoPago(),

                ingreso.isTieneFactura(),

                ingreso.getNumeroFactura(),
                ingreso.getUuidFiscal(),
                ingreso.getObservaciones(),

                ingreso.getEstado(),

                ingreso.getEstadoIntegracionInventario(),

                ingreso.getRegistradoPor().getNombre(),

                ingreso.getCreadoEn()
        );
    }
}
