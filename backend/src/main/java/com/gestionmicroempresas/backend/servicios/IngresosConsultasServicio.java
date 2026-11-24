
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.dto.*;
import com.gestionmicroempresas.backend.entidades.*;
import com.gestionmicroempresas.backend.repositorios.IngresoRepositorio;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class IngresosConsultasServicio {

    private static final int MAX_REGISTROS_REPORTE = 5000;

    private static final Sort ORDEN = Sort.by(
            Sort.Order.desc("creadoEn"),
            Sort.Order.desc("id")
    );

    private final IngresoRepositorio ingresoRepositorio;
    private final ContextoEmpresaServicio contexto;
    private final EntityManager entidad;

    public IngresosConsultasServicio(
            IngresoRepositorio ingresoRepositorio,
            ContextoEmpresaServicio contexto,
            EntityManager entidad
    ) {
        this.ingresoRepositorio = ingresoRepositorio;
        this.contexto = contexto;
        this.entidad = entidad;
    }

    private Long empresaId(Jwt jwt) {

        return contexto
                .obtenerUsuario(jwt)
                .getEmpresa()
                .getId();
    }

    // ==========================================
    // HISTORIAL CON FILTROS Y PAGINACION
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ResumenIngreso> listar(
            Jwt jwt,
            FiltroIngresos filtro,
            int pagina,
            int tamano
    ) {

        if (
                pagina < 0 ||
                        tamano < 1 ||
                        tamano > 50
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Página inválida o tamaño fuera del rango 1-50."
            );
        }

        Long empresaId = empresaId(jwt);

        return ingresoRepositorio.findAll(
                filtro.especificacion(empresaId),

                PageRequest.of(
                        pagina,
                        tamano,
                        ORDEN
                )
        ).map(ResumenIngreso::desde);
    }

    // ==========================================
    // RESUMEN DE TODOS LOS REGISTROS FILTRADOS
    // ==========================================

    @Transactional(readOnly = true)
    public ResumenFiltradoIngresos resumen(
            Jwt jwt,
            FiltroIngresos filtro
    ) {

        return calcularResumen(
                empresaId(jwt),
                filtro
        );
    }

    // ==========================================
    // DATOS PARA EL REPORTE PDF
    // ==========================================

    @Transactional(readOnly = true)
    public ReporteFiltradoIngresos reporte(
            Jwt jwt,
            FiltroIngresos filtro
    ) {

        Long empresaId = empresaId(jwt);

        Specification<Ingreso> especificacion =
                filtro.especificacion(empresaId);

        Page<Ingreso> pagina = ingresoRepositorio.findAll(
                especificacion,

                PageRequest.of(
                        0,
                        MAX_REGISTROS_REPORTE + 1,
                        ORDEN
                )
        );

        if (
                pagina.getTotalElements() >
                        MAX_REGISTROS_REPORTE
        ) {

            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "El reporte supera 5000 operaciones. Reduce el rango de fechas."
            );
        }

        List<ResumenIngreso> registros =
                pagina.getContent()
                        .stream()
                        .map(ResumenIngreso::desde)
                        .toList();

        return new ReporteFiltradoIngresos(
                registros,
                calcularResumen(empresaId, filtro)
        );
    }

    // ==========================================
    // SUMATORIAS DIRECTAMENTE EN POSTGRESQL
    // ==========================================

    private ResumenFiltradoIngresos calcularResumen(
            Long empresaId,
            FiltroIngresos filtro
    ) {

        CriteriaBuilder cb =
                entidad.getCriteriaBuilder();

        CriteriaQuery<Tuple> consulta =
                cb.createTupleQuery();

        Root<Ingreso> raiz =
                consulta.from(Ingreso.class);

        Predicate condiciones = filtro
                .especificacion(empresaId)
                .toPredicate(raiz, consulta, cb);

        // Las operaciones canceladas no suman.

        Predicate vigente = cb.equal(
                raiz.get("estado"),
                EstadoIngreso.REGISTRADO
        );

        // Una deuda debe estar vigente y pendiente.

        Predicate deuda = cb.and(
                vigente,

                cb.equal(
                        raiz.get("estadoPago"),
                        EstadoPagoIngreso.PENDIENTE
                )
        );

        Expression<BigDecimal> total = valorSi(
                cb,
                vigente,
                raiz.get("total")
        );

        Expression<BigDecimal> subtotal = valorSi(
                cb,
                vigente,
                raiz.get("subtotal")
        );

        Expression<BigDecimal> iva = valorSi(
                cb,
                vigente,
                raiz.get("iva")
        );

        Expression<BigDecimal> totalPendiente = valorSi(
                cb,
                deuda,
                raiz.get("total")
        );

        Expression<BigDecimal> subtotalPendiente = valorSi(
                cb,
                deuda,
                raiz.get("subtotal")
        );

        Expression<BigDecimal> ivaPendiente = valorSi(
                cb,
                deuda,
                raiz.get("iva")
        );

        Expression<Long> cantidadPendientes =
                cb.<Long>selectCase()
                        .when(deuda, 1L)
                        .otherwise(0L);

        consulta.multiselect(

                cb.coalesce(
                        cb.sum(total),
                        BigDecimal.ZERO
                ).alias("total"),

                cb.coalesce(
                        cb.sum(subtotal),
                        BigDecimal.ZERO
                ).alias("subtotal"),

                cb.coalesce(
                        cb.sum(iva),
                        BigDecimal.ZERO
                ).alias("iva"),

                cb.coalesce(
                        cb.sum(totalPendiente),
                        BigDecimal.ZERO
                ).alias("pendiente"),

                cb.coalesce(
                        cb.sum(subtotalPendiente),
                        BigDecimal.ZERO
                ).alias("subtotalPendiente"),

                cb.coalesce(
                        cb.sum(ivaPendiente),
                        BigDecimal.ZERO
                ).alias("ivaPendiente"),

                cb.count(raiz)
                        .alias("cantidadRegistros"),

                cb.coalesce(
                        cb.sum(cantidadPendientes),
                        0L
                ).alias("cantidadPendientes")
        );

        consulta.where(condiciones);

        Tuple fila = entidad
                .createQuery(consulta)
                .getSingleResult();

        return new ResumenFiltradoIngresos(

                fila.get(
                        "total",
                        BigDecimal.class
                ),

                fila.get(
                        "subtotal",
                        BigDecimal.class
                ),

                fila.get(
                        "iva",
                        BigDecimal.class
                ),

                fila.get(
                        "pendiente",
                        BigDecimal.class
                ),

                fila.get(
                        "subtotalPendiente",
                        BigDecimal.class
                ),

                fila.get(
                        "ivaPendiente",
                        BigDecimal.class
                ),

                fila.get(
                        "cantidadRegistros",
                        Long.class
                ),

                fila.get(
                        "cantidadPendientes",
                        Long.class
                )
        );
    }

    private Expression<BigDecimal> valorSi(
            CriteriaBuilder cb,
            Predicate condicion,
            Expression<BigDecimal> campo
    ) {

        return cb.<BigDecimal>selectCase()
                .when(condicion, campo)
                .otherwise(BigDecimal.ZERO);
    }
}
