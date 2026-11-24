
package com.gestionmicroempresas.backend.controladores;

import com.gestionmicroempresas.backend.dto.RespuestaCliente;
import com.gestionmicroempresas.backend.dto.SolicitudCliente;
import com.gestionmicroempresas.backend.servicios.ClientesServicio;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
public class ClientesControlador {

    private final ClientesServicio clientesServicio;

    public ClientesControlador(
            ClientesServicio clientesServicio
    ) {
        this.clientesServicio = clientesServicio;
    }

    @PostMapping
    public ResponseEntity<RespuestaCliente> registrarCliente(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SolicitudCliente solicitud
    ) {

        RespuestaCliente cliente =
                clientesServicio.registrarCliente(
                        jwt,
                        solicitud
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(cliente);
    }

    @GetMapping
    public ResponseEntity<Page<RespuestaCliente>> listarClientes(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam(
                    name = "buscar",
                    defaultValue = ""
            )
            String buscar,

            @RequestParam(
                    name = "page",
                    defaultValue = "0"
            )
            int pagina,

            @RequestParam(
                    name = "size",
                    defaultValue = "20"
            )
            int tamano
    ) {

        return ResponseEntity.ok(
                clientesServicio.listarClientes(
                        jwt,
                        buscar,
                        pagina,
                        tamano
                )
        );
    }
}
