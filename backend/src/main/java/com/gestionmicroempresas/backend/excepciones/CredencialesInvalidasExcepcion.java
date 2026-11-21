
package com.gestionmicroempresas.backend.excepciones;

public class CredencialesInvalidasExcepcion
        extends RuntimeException {

    public CredencialesInvalidasExcepcion() {
        super("Correo o contraseña incorrectos, o cuenta no disponible.");
    }
}
