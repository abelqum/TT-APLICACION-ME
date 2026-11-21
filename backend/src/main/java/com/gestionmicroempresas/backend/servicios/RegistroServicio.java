
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.RespuestaRegistroEmpresa;
import com.gestionmicroempresas.backend.dto.SolicitudRegistroEmpresa;
import com.gestionmicroempresas.backend.entidades.Empresa;
import com.gestionmicroempresas.backend.entidades.Rol;
import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.excepciones.CorreoYaRegistradoExcepcion;
import com.gestionmicroempresas.backend.repositorios.EmpresaRepositorio;
import com.gestionmicroempresas.backend.repositorios.UsuarioRepositorio;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class RegistroServicio {

    private final EmpresaRepositorio empresaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder codificadorContrasenas;

    public RegistroServicio(
            EmpresaRepositorio empresaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            PasswordEncoder codificadorContrasenas
    ) {
        this.empresaRepositorio = empresaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.codificadorContrasenas = codificadorContrasenas;
    }

    @Transactional
    public RespuestaRegistroEmpresa registrarEmpresa(
            SolicitudRegistroEmpresa solicitud
    ) {

        // 1. Normalizar los datos recibidos.

        String nombreEmpresa = solicitud.nombreEmpresa().trim();
        String nombre = solicitud.nombre().trim();

        String correo = solicitud.correo()
                .trim()
                .toLowerCase(Locale.ROOT);

        // 2. Verificar que las contraseñas coincidan.

        if (!solicitud.contrasena()
                .equals(solicitud.confirmacionContrasena())) {

            throw new IllegalArgumentException(
                    "Las contraseñas no coinciden."
            );
        }

        // 3. Verificar el limite de bytes de BCrypt.

        int longitudBytes = solicitud.contrasena()
                .getBytes(StandardCharsets.UTF_8).length;

        if (longitudBytes > 72) {
            throw new IllegalArgumentException(
                    "La contraseña es demasiado larga."
            );
        }

        // 4. Comprobar que el correo no este registrado.

        if (usuarioRepositorio.existsByCorreoIgnoreCase(correo)) {
            throw new CorreoYaRegistradoExcepcion();
        }

        // 5. Crear la empresa.

        Empresa empresa = new Empresa(nombreEmpresa);

        empresa = empresaRepositorio.save(empresa);

        // 6. Proteger la contraseña.

        String contrasenaHash = codificadorContrasenas
                .encode(solicitud.contrasena());

        // 7. Crear al administrador de la empresa.

        Usuario administrador = new Usuario(
                empresa,
                nombre,
                correo,
                contrasenaHash,
                Rol.ADMIN
        );

        administrador = usuarioRepositorio.save(administrador);

        // 8. Devolver los identificadores generados.

        return new RespuestaRegistroEmpresa(
                empresa.getId(),
                administrador.getId(),
                "La empresa y su administrador se registraron correctamente."
        );
    }
}
