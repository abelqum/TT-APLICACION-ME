
package com.gestionmicroempresas.backend.dto;

import java.util.List;

public record ReporteFiltradoIngresos(

        List<ResumenIngreso> registros,
        ResumenFiltradoIngresos resumen

) {
}
