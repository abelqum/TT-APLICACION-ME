
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.entidades.EstadoEmpresa;
import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.repositorios.UsuarioRepositorio;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContextoEmpresaServicio {

    private final UsuarioRepositorio usuarioRepositorio;

    public ContextoEmpresaServicio(
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuario(Jwt jwt) {

        if (jwt == null) {
            throw new AccessDeniedException(
                    "Debes iniciar sesión."
            );
        }

        Long usuarioId;

        try {
            usuarioId = Long.valueOf(jwt.getSubject());
        } catch (NumberFormatException excepcion) {
            throw new AccessDeniedException(
                    "La sesión no es válida."
            );
        }

        Number empresaClaim = jwt.getClaim("empresaId");

        if (empresaClaim == null) {
            throw new AccessDeniedException(
                    "No se identificó la empresa."
            );
        }

        Long empresaId = empresaClaim.longValue();

        Usuario usuario = usuarioRepositorio
                .findByIdAndEmpresa_Id(usuarioId, empresaId)
                .orElseThrow(() -> new AccessDeniedException(
                        "No tienes acceso a esta empresa."
                ));

        if (!usuario.isActivo()) {
            throw new AccessDeniedException(
                    "El usuario está inactivo."
            );
        }

        if (usuario.getEmpresa().getEstado()
                != EstadoEmpresa.ACTIVA) {

            throw new AccessDeniedException(
                    "La empresa no está activa."
            );
        }

        return usuario;
    }
}
