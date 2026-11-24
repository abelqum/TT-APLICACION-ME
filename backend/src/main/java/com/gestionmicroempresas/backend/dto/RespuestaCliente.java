
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.Cliente;

public record RespuestaCliente(
        Long id,
        String nombre,
        String rfc,
        String correo,
        String telefono,
        boolean activo
) {

    public static RespuestaCliente desde(Cliente cliente) {

        return new RespuestaCliente(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getRfc(),
                cliente.getCorreo(),
                cliente.getTelefono(),
                cliente.isActivo()
        );
    }
}
