
package com.gestionmicroempresas.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudRegistroEmpleado(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(
                max = 150,
                message = "El nombre es demasiado largo."
        )
        String nombre,

        @NotBlank(message = "El correo es obligatorio.")
        @Email(message = "El correo no es válido.")
        @Size(
                max = 200,
                message = "El correo es demasiado largo."
        )
        String correo,

        @NotBlank(message = "La contraseña es obligatoria.")
        @Size(
                min = 8,
                max = 72,
                message = "La contraseña debe tener entre 8 y 72 caracteres."
        )
        String contrasena

) {
}
