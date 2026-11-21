
package com.gestionmicroempresas.backend.dto;

public record RespuestaRegistroEmpresa(

        Long empresaId,

        Long usuarioId,

        String mensaje

) {
}
