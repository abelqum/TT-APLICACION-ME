
package com.gestionmicroempresas.backend.controladores;

import com.gestionmicroempresas.backend.dto.RespuestaEmpleado;
import com.gestionmicroempresas.backend.dto.SolicitudRegistroEmpleado;
import com.gestionmicroempresas.backend.servicios.UsuariosServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuariosControlador {

    private final UsuariosServicio usuariosServicio;

    public UsuariosControlador(
            UsuariosServicio usuariosServicio
    ) {
        this.usuariosServicio = usuariosServicio;
    }

    @PostMapping("/empleados")
    public ResponseEntity<RespuestaEmpleado> registrarEmpleado(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SolicitudRegistroEmpleado solicitud
    ) {

        RespuestaEmpleado empleado =
                usuariosServicio.registrarEmpleado(
                        jwt,
                        solicitud
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(empleado);
    }

    @GetMapping("/empleados")
    public ResponseEntity<List<RespuestaEmpleado>> listarEmpleados(
            @AuthenticationPrincipal Jwt jwt
    ) {

        List<RespuestaEmpleado> empleados =
                usuariosServicio.listarEmpleados(jwt);

        return ResponseEntity.ok(empleados);
    }
}
