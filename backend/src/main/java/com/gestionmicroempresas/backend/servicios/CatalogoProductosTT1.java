
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.SolicitudDetalleIngreso;
import com.gestionmicroempresas.backend.entidades.TipoConceptoIngreso;

import java.math.BigDecimal;
import java.util.Map;

public final class CatalogoProductosTT1 {

    private CatalogoProductosTT1() {
    }

    private record Producto(
            String nombre,
            String unidad,
            BigDecimal precio,
            BigDecimal iva
    ) {
    }

    private static final Map<String, Producto> CATALOGO =
            Map.of(
                    "MAR-001", new Producto(
                            "Martillo",
                            "PIEZA",
                            new BigDecimal("50.00"),
                            new BigDecimal("0.16")
                    ),
                    "ESC-001", new Producto(
                            "Escoba",
                            "PIEZA",
                            new BigDecimal("80.00"),
                            new BigDecimal("0.16")
                    ),
                    "CLA-001", new Producto(
                            "Caja de clavos",
                            "CAJA",
                            new BigDecimal("20.00"),
                            new BigDecimal("0.16")
                    )
            );

    public static void validarProducto(
            SolicitudDetalleIngreso detalle
    ) {

        if (detalle.tipoConcepto()
                != TipoConceptoIngreso.PRODUCTO) {
            return;
        }

        String clave = detalle.claveArticulo();

        Producto producto = clave == null
                ? null
                : CATALOGO.get(clave);

        if (
                producto == null
                        || !producto.nombre().equals(
                        detalle.concepto().trim()
                )
                        || !producto.unidad().equals(
                        detalle.unidadMedida().trim()
                )
                        || producto.precio().compareTo(
                        detalle.precioUnitario()
                ) != 0
                        || producto.iva().compareTo(
                        detalle.tasaIva()
                ) != 0
        ) {

            throw new IllegalArgumentException(
                    "El producto o su precio no coincide " +
                            "con el catálogo de demostración TT1."
            );
        }
    }
}
