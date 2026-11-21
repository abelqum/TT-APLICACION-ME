
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.Usuario;

public record RespuestaSesion(

        Long id,
        String nombre,
        String correo,
        String rol,
        EmpresaResumen empresa

) {

    public record EmpresaResumen(
            Long id,
            String nombre
    ) {
    }

    public static RespuestaSesion desdeUsuario(Usuario usuario) {

        return new RespuestaSesion(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol().name(),

                new EmpresaResumen(
                        usuario.getEmpresa().getId(),
                        usuario.getEmpresa().getNombre()
                )
        );
    }
}
