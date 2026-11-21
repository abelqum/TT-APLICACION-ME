
package com.gestionmicroempresas.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SolicitudInicioSesion(

        @NotBlank(message = "El correo es obligatorio.")
        @Email(message = "El correo electrónico no es válido.")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria.")
        String contrasena

) {
}
