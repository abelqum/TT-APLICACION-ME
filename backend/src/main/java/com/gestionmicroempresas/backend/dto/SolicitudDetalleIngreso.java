
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.TipoConceptoIngreso;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SolicitudDetalleIngreso(

        @NotNull(message = "Selecciona el tipo de concepto.")
        TipoConceptoIngreso tipoConcepto,

        @Size(max = 100)
        String claveArticulo,

        @NotBlank(message = "El concepto es obligatorio.")
        @Size(max = 200)
        String concepto,

        @NotBlank(message = "La unidad de medida es obligatoria.")
        @Size(max = 40)
        String unidadMedida,

        @NotNull(message = "La cantidad es obligatoria.")
        @DecimalMin(value = "0.001")
        @Digits(integer = 9, fraction = 3)
        BigDecimal cantidad,

        @NotNull(message = "El precio es obligatorio.")
        @DecimalMin(value = "0.01")
        @Digits(integer = 12, fraction = 2)
        BigDecimal precioUnitario,

        @NotNull(message = "La tasa de IVA es obligatoria.")
        @DecimalMin(value = "0.0")
        @Digits(integer = 1, fraction = 4)
        BigDecimal tasaIva

) {
}
