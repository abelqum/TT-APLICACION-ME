
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.RespuestaSesion;
import com.gestionmicroempresas.backend.dto.SolicitudInicioSesion;
import com.gestionmicroempresas.backend.entidades.EstadoEmpresa;
import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.excepciones.CredencialesInvalidasExcepcion;
import com.gestionmicroempresas.backend.repositorios.UsuarioRepositorio;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AutenticacionServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder codificadorContrasenas;
    private final TokenServicio tokenServicio;

    public AutenticacionServicio(
            UsuarioRepositorio usuarioRepositorio,
            PasswordEncoder codificadorContrasenas,
            TokenServicio tokenServicio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.codificadorContrasenas = codificadorContrasenas;
        this.tokenServicio = tokenServicio;
    }

    @Transactional(readOnly = true)
    public ResultadoInicioSesion iniciarSesion(
            SolicitudInicioSesion solicitud
    ) {

        String correo = solicitud.correo()
                .trim()
                .toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepositorio
                .findByCorreoIgnoreCase(correo)
                .orElseThrow(CredencialesInvalidasExcepcion::new);

        if (!codificadorContrasenas.matches(
                solicitud.contrasena(),
                usuario.getContrasenaHash()
        )) {
            throw new CredencialesInvalidasExcepcion();
        }

        verificarUsuarioHabilitado(usuario);

        String token = tokenServicio.generarToken(usuario);

        return new ResultadoInicioSesion(
                RespuestaSesion.desdeUsuario(usuario),
                token
        );
    }

    @Transactional(readOnly = true)
    public RespuestaSesion obtenerSesionActual(Jwt jwt) {

        Long usuarioId;
        Long empresaId;

        try {
            usuarioId = Long.valueOf(jwt.getSubject());

            Number empresaClaim = jwt.getClaim("empresaId");

            if (empresaClaim == null) {
                throw new IllegalArgumentException();
            }

            empresaId = empresaClaim.longValue();

        } catch (IllegalArgumentException excepcion) {
            throw new CredencialesInvalidasExcepcion();
        }

        Usuario usuario = usuarioRepositorio
                .findByIdAndEmpresa_Id(usuarioId, empresaId)
                .orElseThrow(CredencialesInvalidasExcepcion::new);

        verificarUsuarioHabilitado(usuario);

        return RespuestaSesion.desdeUsuario(usuario);
    }

    private void verificarUsuarioHabilitado(Usuario usuario) {

        if (!usuario.isActivo()) {
            throw new CredencialesInvalidasExcepcion();
        }

        if (usuario.getEmpresa().getEstado()
                != EstadoEmpresa.ACTIVA) {
            throw new CredencialesInvalidasExcepcion();
        }
    }

    public record ResultadoInicioSesion(
            RespuestaSesion usuario,
            String token
    ) {
    }
}
