
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.RespuestaEmpleado;
import com.gestionmicroempresas.backend.dto.SolicitudRegistroEmpleado;

import com.gestionmicroempresas.backend.entidades.Empresa;
import com.gestionmicroempresas.backend.entidades.EstadoEmpresa;
import com.gestionmicroempresas.backend.entidades.Rol;
import com.gestionmicroempresas.backend.entidades.Usuario;

import com.gestionmicroempresas.backend.excepciones.CorreoYaRegistradoExcepcion;
import com.gestionmicroempresas.backend.repositorios.UsuarioRepositorio;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

@Service
public class UsuariosServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder codificadorContrasenas;

    public UsuariosServicio(
            UsuarioRepositorio usuarioRepositorio,
            PasswordEncoder codificadorContrasenas
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.codificadorContrasenas = codificadorContrasenas;
    }

    @Transactional
    public RespuestaEmpleado registrarEmpleado(
            Jwt jwt,
            SolicitudRegistroEmpleado solicitud
    ) {

        // 1. Identificar al administrador autenticado.
        Usuario administrador = obtenerAdministrador(jwt);

        // 2. Obtener la empresa desde el servidor.
        Empresa empresa = administrador.getEmpresa();

        // 3. Normalizar los datos.
        String nombre = solicitud.nombre().trim();

        String correo = solicitud.correo()
                .trim()
                .toLowerCase(Locale.ROOT);

        // 4. Comprobar el limite de BCrypt.
        int longitudBytes = solicitud.contrasena()
                .getBytes(StandardCharsets.UTF_8).length;

        if (longitudBytes > 72) {
            throw new IllegalArgumentException(
                    "La contraseña es demasiado larga."
            );
        }

        // 5. Verificar si el correo ya existe.
        if (usuarioRepositorio.existsByCorreoIgnoreCase(correo)) {
            throw new CorreoYaRegistradoExcepcion();
        }

        // 6. Proteger la contraseña.
        String contrasenaHash = codificadorContrasenas
                .encode(solicitud.contrasena());

        // 7. Crear el empleado en la empresa autenticada.
        Usuario empleado = new Usuario(
                empresa,
                nombre,
                correo,
                contrasenaHash,
                Rol.EMPLEADO
        );

        // 8. Guardar el empleado.
        empleado = usuarioRepositorio.saveAndFlush(empleado);

        // 9. Devolver la respuesta.
        return RespuestaEmpleado.desdeUsuario(empleado);
    }

    @Transactional(readOnly = true)
    public List<RespuestaEmpleado> listarEmpleados(
            Jwt jwt
    ) {

        Usuario administrador = obtenerAdministrador(jwt);

        Long empresaId = administrador
                .getEmpresa()
                .getId();

        return usuarioRepositorio
                .findAllByEmpresa_IdAndRolOrderByNombreAsc(
                        empresaId,
                        Rol.EMPLEADO
                )
                .stream()
                .map(RespuestaEmpleado::desdeUsuario)
                .toList();
    }

    private Usuario obtenerAdministrador(Jwt jwt) {

        // El JWT ya fue validado por Spring Security.
        Long usuarioId = Long.valueOf(jwt.getSubject());

        Number empresaClaim = jwt.getClaim("empresaId");

        if (empresaClaim == null) {
            throw new AccessDeniedException(
                    "No tienes permiso para esta operación."
            );
        }

        Long empresaId = empresaClaim.longValue();

        // Consulta al usuario y su empresa.
        Usuario usuario = usuarioRepositorio
                .findByIdAndEmpresa_Id(usuarioId, empresaId)
                .orElseThrow(() -> new AccessDeniedException(
                        "No tienes permiso para esta operación."
                ));

        // Verificar el estado actual en PostgreSQL.
        if (
                !usuario.isActivo() ||
                        usuario.getRol() != Rol.ADMIN ||
                        usuario.getEmpresa().getEstado() != EstadoEmpresa.ACTIVA
        ) {
            throw new AccessDeniedException(
                    "No tienes permiso para esta operación."
            );
        }

        return usuario;
    }
}
