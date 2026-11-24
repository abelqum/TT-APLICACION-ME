
package com.gestionmicroempresas.backend.controladores;

import com.gestionmicroempresas.backend.dto.*;
import com.gestionmicroempresas.backend.servicios.IngresosServicio;
import com.gestionmicroempresas.backend.servicios.IngresosConsultasServicio;
import com.gestionmicroempresas.backend.servicios.IngresosEdicionServicio;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ingresos")
public class IngresosControlador {

    private final IngresosServicio ingresosServicio;
    private final IngresosConsultasServicio consultasServicio;
    private final IngresosEdicionServicio edicionServicio;

    public IngresosControlador(
            IngresosServicio ingresosServicio,
            IngresosConsultasServicio consultasServicio,
            IngresosEdicionServicio edicionServicio
    ) {

        this.ingresosServicio = ingresosServicio;
        this.consultasServicio = consultasServicio;
        this.edicionServicio = edicionServicio;
    }

    // ==========================================
    // REGISTRAR INGRESO
    // ==========================================

    @PostMapping
    public ResponseEntity<RespuestaIngreso> registrarIngreso(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SolicitudIngreso solicitud
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ingresosServicio.registrarIngreso(
                                jwt,
                                solicitud
                        )
                );
    }

    // ==========================================
    // HISTORIAL FILTRADO
    // ==========================================

    @GetMapping
    public Page<ResumenIngreso> listar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Map<String, String> parametros
    ) {

        FiltroIngresos filtro =
                FiltroIngresos.desdeParametros(parametros);

        int pagina = FiltroIngresos.entero(
                parametros,
                "page",
                0
        );

        int tamano = FiltroIngresos.entero(
                parametros,
                "size",
                20
        );

        return consultasServicio.listar(
                jwt,
                filtro,
                pagina,
                tamano
        );
    }

    // ==========================================
    // RESUMEN DE IMPORTES
    // ==========================================

    @GetMapping("/resumen")
    public ResumenFiltradoIngresos resumen(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Map<String, String> parametros
    ) {

        return consultasServicio.resumen(
                jwt,
                FiltroIngresos.desdeParametros(parametros)
        );
    }

    // ==========================================
    // DATOS PARA REPORTE PDF
    // ==========================================

    @GetMapping("/reporte")
    public ReporteFiltradoIngresos reporte(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Map<String, String> parametros
    ) {

        return consultasServicio.reporte(
                jwt,
                FiltroIngresos.desdeParametros(parametros)
        );
    }

    // ==========================================
    // CONSULTAR UN INGRESO
    // ==========================================

    @GetMapping("/{id}")
    public RespuestaIngreso consultarIngreso(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id
    ) {

        return ingresosServicio.consultarIngreso(
                jwt,
                id
        );
    }

    // ==========================================
    // ACTUALIZAR UN INGRESO
    // ==========================================

    @PutMapping("/{id}")
    public RespuestaIngreso actualizarIngreso(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody SolicitudIngreso solicitud
    ) {

        return edicionServicio.actualizar(
                jwt,
                id,
                solicitud
        );
    }

    // ==========================================
    // CANCELAR UN INGRESO
    // ==========================================

    @PostMapping("/{id}/cancelar")
    public RespuestaIngreso cancelarIngreso(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id
    ) {

        return edicionServicio.cancelar(
                jwt,
                id
        );
    }
}
