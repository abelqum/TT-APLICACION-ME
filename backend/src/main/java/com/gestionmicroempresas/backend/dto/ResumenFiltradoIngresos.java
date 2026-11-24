
package com.gestionmicroempresas.backend.dto;

import java.math.BigDecimal;

public record ResumenFiltradoIngresos(

        BigDecimal total,
        BigDecimal subtotal,
        BigDecimal iva,

        BigDecimal pendiente,
        BigDecimal subtotalPendiente,
        BigDecimal ivaPendiente,

        long cantidadRegistros,
        long cantidadPendientes

) {
}
