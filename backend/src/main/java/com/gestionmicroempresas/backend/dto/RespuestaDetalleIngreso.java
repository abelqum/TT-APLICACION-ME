
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.DetalleIngreso;
import com.gestionmicroempresas.backend.entidades.TipoConceptoIngreso;

import java.math.BigDecimal;

public record RespuestaDetalleIngreso(

        Long id,
        TipoConceptoIngreso tipoConcepto,
        String claveArticulo,
        String concepto,
        String unidadMedida,
        BigDecimal cantidad,
        BigDecimal precioUnitario,
        BigDecimal tasaIva,
        BigDecimal subtotal,
        BigDecimal iva,
        BigDecimal total

) {

    public static RespuestaDetalleIngreso desde(
            DetalleIngreso detalle
    ) {

        return new RespuestaDetalleIngreso(
                detalle.getId(),
                detalle.getTipoConcepto(),
                detalle.getClaveArticulo(),
                detalle.getConcepto(),
                detalle.getUnidadMedida(),
                detalle.getCantidad(),
                detalle.getPrecioUnitario(),
                detalle.getTasaIva(),
                detalle.getSubtotal(),
                detalle.getIva(),
                detalle.getTotal()
        );
    }
}
