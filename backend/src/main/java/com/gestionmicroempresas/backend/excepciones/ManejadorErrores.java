
package com.gestionmicroempresas.backend.excepciones;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ManejadorErrores {

    // Errores de validacion de los formularios.

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> manejarValidacion(
            MethodArgumentNotValidException excepcion
    ) {

        String mensaje = excepcion.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Los datos enviados no son válidos.");

        return ResponseEntity
                .badRequest()
                .body(Map.of("mensaje", mensaje));
    }

    // Correo registrado previamente.

    @ExceptionHandler(CorreoYaRegistradoExcepcion.class)
    public ResponseEntity<Map<String, String>> manejarCorreoDuplicado(
            CorreoYaRegistradoExcepcion excepcion
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "mensaje",
                        excepcion.getMessage()
                ));
    }

    // Errores de reglas de negocio.

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> manejarArgumentoInvalido(
            IllegalArgumentException excepcion
    ) {

        return ResponseEntity
                .badRequest()
                .body(Map.of(
                        "mensaje",
                        excepcion.getMessage()
                ));
    }

    // Conflictos de restricciones en PostgreSQL.

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> manejarIntegridad(
            DataIntegrityViolationException excepcion
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "mensaje",
                        "No se pudo completar el registro por un conflicto de datos."
                ));
    }



    @ExceptionHandler(CredencialesInvalidasExcepcion.class)
    public ResponseEntity<Map<String, String>> manejarCredencialesInvalidas(
            CredencialesInvalidasExcepcion excepcion
    ) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "mensaje",
                        excepcion.getMessage()
                ));
    }

}
