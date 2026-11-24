
package com.gestionmicroempresas.backend.dto;

import java.util.List;

public record RespuestaIngreso(

        ResumenIngreso ingreso,

        List<RespuestaDetalleIngreso> detalles

) {
}
