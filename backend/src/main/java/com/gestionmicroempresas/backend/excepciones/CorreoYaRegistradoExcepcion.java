
package com.gestionmicroempresas.backend.excepciones;

public class CorreoYaRegistradoExcepcion
        extends RuntimeException {

    public CorreoYaRegistradoExcepcion() {
        super("El correo electrónico ya está registrado.");
    }
}
