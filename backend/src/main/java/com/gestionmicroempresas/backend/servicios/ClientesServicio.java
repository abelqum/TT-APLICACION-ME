
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.RespuestaCliente;
import com.gestionmicroempresas.backend.dto.SolicitudCliente;
import com.gestionmicroempresas.backend.entidades.Cliente;
import com.gestionmicroempresas.backend.entidades.Empresa;
import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.repositorios.ClienteRepositorio;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class ClientesServicio {

    private final ClienteRepositorio clienteRepositorio;
    private final ContextoEmpresaServicio contextoEmpresaServicio;

    public ClientesServicio(
            ClienteRepositorio clienteRepositorio,
            ContextoEmpresaServicio contextoEmpresaServicio
    ) {
        this.clienteRepositorio = clienteRepositorio;
        this.contextoEmpresaServicio = contextoEmpresaServicio;
    }

    @Transactional
    public RespuestaCliente registrarCliente(
            Jwt jwt,
            SolicitudCliente solicitud
    ) {

        Usuario usuario =
                contextoEmpresaServicio.obtenerUsuario(jwt);

        Empresa empresa = usuario.getEmpresa();

        String nombre = solicitud.nombre().trim();

        String rfc = limpiar(solicitud.rfc());

        if (rfc != null) {
            rfc = rfc.toUpperCase(Locale.ROOT);

            if (rfc.length() < 12 || rfc.length() > 13) {
                throw new IllegalArgumentException(
                        "El RFC debe tener 12 o 13 caracteres."
                );
            }
        }

        String correo = limpiar(solicitud.correo());

        if (correo != null) {
            correo = correo.toLowerCase(Locale.ROOT);
        }

        Cliente cliente = new Cliente(
                empresa,
                nombre,
                rfc,
                correo,
                limpiar(solicitud.telefono())
        );

        cliente = clienteRepositorio.saveAndFlush(cliente);

        return RespuestaCliente.desde(cliente);
    }

    @Transactional(readOnly = true)
    public Page<RespuestaCliente> listarClientes(
            Jwt jwt,
            String buscar,
            int pagina,
            int tamano
    ) {

        Usuario usuario =
                contextoEmpresaServicio.obtenerUsuario(jwt);

        if (pagina < 0 || tamano < 1 || tamano > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los parámetros de paginación no son válidos."
            );
        }

        Long empresaId = usuario.getEmpresa().getId();

        String filtro = buscar == null
                ? ""
                : buscar.trim();

        PageRequest paginacion =
                PageRequest.of(pagina, tamano);

        return clienteRepositorio
                .findAllByEmpresa_IdAndActivoTrueAndNombreContainingIgnoreCaseOrderByNombreAsc(
                        empresaId,
                        filtro,
                        paginacion
                )
                .map(RespuestaCliente::desde);
    }

    private String limpiar(String valor) {

        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }
}
