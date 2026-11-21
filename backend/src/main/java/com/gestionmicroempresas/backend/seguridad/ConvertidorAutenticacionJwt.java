
package com.gestionmicroempresas.backend.seguridad;

import com.gestionmicroempresas.backend.entidades.EstadoEmpresa;
import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.repositorios.UsuarioRepositorio;

import org.springframework.core.convert.converter.Converter;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AbstractAuthenticationToken;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ConvertidorAutenticacionJwt
        implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepositorio usuarioRepositorio;

    public ConvertidorAutenticacionJwt(
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

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
            throw new BadCredentialsException(
                    "La sesión no es válida."
            );
        }

        Usuario usuario = usuarioRepositorio
                .findByIdAndEmpresa_Id(usuarioId, empresaId)
                .orElseThrow(() -> new BadCredentialsException(
                        "La sesión no es válida."
                ));

        if (!usuario.isActivo()) {
            throw new BadCredentialsException(
                    "La cuenta está desactivada."
            );
        }

        if (usuario.getEmpresa().getEstado()
                != EstadoEmpresa.ACTIVA) {
            throw new BadCredentialsException(
                    "La empresa está suspendida."
            );
        }

        String autoridad = "ROLE_" + usuario.getRol().name();

        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority(autoridad)),
                usuario.getCorreo()
        );
    }
}
