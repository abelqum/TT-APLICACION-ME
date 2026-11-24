
package com.gestionmicroempresas.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudCliente(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 200)
        String nombre,

        @Size(min = 12, max = 13,
                message = "El RFC debe tener 12 o 13 caracteres.")
        String rfc,

        @Email(message = "El correo no es válido.")
        @Size(max = 200)
        String correo,

        @Size(max = 30)
        String telefono

) {
}
