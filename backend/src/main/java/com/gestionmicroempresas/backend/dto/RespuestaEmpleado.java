
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.Usuario;

public record RespuestaEmpleado(

        Long id,
        String nombre,
        String correo,
        String rol,
        boolean activo

) {

    public static RespuestaEmpleado desdeUsuario(
            Usuario usuario
    ) {

        return new RespuestaEmpleado(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol().name(),
                usuario.isActivo()
        );
    }
}
