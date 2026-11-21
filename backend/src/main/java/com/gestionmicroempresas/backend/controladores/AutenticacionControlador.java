
package com.gestionmicroempresas.backend.controladores;

import com.gestionmicroempresas.backend.dto.RespuestaRegistroEmpresa;
import com.gestionmicroempresas.backend.dto.RespuestaSesion;
import com.gestionmicroempresas.backend.dto.SolicitudInicioSesion;
import com.gestionmicroempresas.backend.dto.SolicitudRegistroEmpresa;

import com.gestionmicroempresas.backend.servicios.AutenticacionServicio;
import com.gestionmicroempresas.backend.servicios.RegistroServicio;
import com.gestionmicroempresas.backend.servicios.TokenServicio;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CsrfToken;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/autenticacion")
public class AutenticacionControlador {

    private final RegistroServicio registroServicio;
    private final AutenticacionServicio autenticacionServicio;
    private final boolean cookieSegura;

    public AutenticacionControlador(
            RegistroServicio registroServicio,
            AutenticacionServicio autenticacionServicio,
            @Value("${app.jwt.cookie-segura}") boolean cookieSegura
    ) {
        this.registroServicio = registroServicio;
        this.autenticacionServicio = autenticacionServicio;
        this.cookieSegura = cookieSegura;
    }

    @GetMapping("/csrf")
    public Map<String, String> obtenerCsrf(CsrfToken token) {

        token.getToken();

        return Map.of(
                "mensaje",
                "Token CSRF disponible."
        );
    }

    @PostMapping("/registrar-empresa")
    public ResponseEntity<RespuestaRegistroEmpresa> registrarEmpresa(
            @Valid @RequestBody SolicitudRegistroEmpresa solicitud
    ) {

        RespuestaRegistroEmpresa respuesta =
                registroServicio.registrarEmpresa(solicitud);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    @PostMapping("/iniciar-sesion")
    public ResponseEntity<RespuestaSesion> iniciarSesion(
            @Valid @RequestBody SolicitudInicioSesion solicitud
    ) {

        AutenticacionServicio.ResultadoInicioSesion resultado =
                autenticacionServicio.iniciarSesion(solicitud);

        ResponseCookie cookie = ResponseCookie
                .from(
                        TokenServicio.NOMBRE_COOKIE,
                        resultado.token()
                )
                .httpOnly(true)
                .secure(cookieSegura)
                .sameSite("Lax")
                .path("/api")
                .maxAge(TokenServicio.DURACION)
                .build();

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookie.toString()
                )
                .body(resultado.usuario());
    }

    @GetMapping("/sesion")
    public ResponseEntity<RespuestaSesion> obtenerSesion(
            @AuthenticationPrincipal Jwt jwt
    ) {

        RespuestaSesion respuesta =
                autenticacionServicio.obtenerSesionActual(jwt);

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/cerrar-sesion")
    public ResponseEntity<Void> cerrarSesion() {

        ResponseCookie cookie = ResponseCookie
                .from(TokenServicio.NOMBRE_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSegura)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity
                .noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookie.toString()
                )
                .build();
    }
}
