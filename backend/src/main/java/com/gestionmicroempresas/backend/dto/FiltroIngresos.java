
package com.gestionmicroempresas.backend.dto;

import com.gestionmicroempresas.backend.entidades.*;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public record FiltroIngresos(
        String buscar,
        Long clienteId,
        String estado,
        String fechaReferencia,
        Integer anio,
        Integer mes,
        LocalDate fechaDesde,
        LocalDate fechaHasta
) {

    private static final ZoneId ZONA =
            ZoneId.of("America/Mexico_City");

    public static FiltroIngresos desdeParametros(
            Map<String, String> parametros
    ) {

        try {
            String buscar = valor(parametros, "buscar");
            String id = valor(parametros, "clienteId");
            String estado = valor(parametros, "estado");

            String referencia = valor(
                    parametros,
                    "fechaReferencia"
            );

            String anio = valor(parametros, "anio");
            String mes = valor(parametros, "mes");

            String desde = valor(
                    parametros,
                    "fechaDesde"
            );

            String hasta = valor(
                    parametros,
                    "fechaHasta"
            );

            FiltroIngresos filtro = new FiltroIngresos(
                    buscar == null ? "" : buscar,

                    id == null
                            ? null
                            : Long.valueOf(id),

                    estado == null
                            ? ""
                            : estado.toUpperCase(Locale.ROOT),

                    referencia == null
                            ? "REGISTRO"
                            : referencia.toUpperCase(Locale.ROOT),

                    anio == null
                            ? null
                            : Integer.valueOf(anio),

                    mes == null
                            ? null
                            : Integer.valueOf(mes),

                    desde == null
                            ? null
                            : LocalDate.parse(desde),

                    hasta == null
                            ? null
                            : LocalDate.parse(hasta)
            );

            filtro.validar();

            return filtro;

        } catch (
                NumberFormatException |
                DateTimeParseException error
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los filtros contienen una fecha o un número inválido."
            );
        }
    }

    public static int entero(
            Map<String, String> parametros,
            String nombre,
            int defecto
    ) {

        String valor = valor(parametros, nombre);

        if (valor == null) {
            return defecto;
        }

        try {
            return Integer.parseInt(valor);

        } catch (NumberFormatException error) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Parámetro inválido: " + nombre
            );
        }
    }

    private static String valor(
            Map<String, String> parametros,
            String clave
    ) {

        String texto = parametros.get(clave);

        return texto == null || texto.isBlank()
                ? null
                : texto.trim();
    }

    private void validar() {

        if (!List.of(
                "",
                "PAGADO",
                "PENDIENTE",
                "CANCELADO"
        ).contains(estado)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado inválido."
            );
        }

        if (!List.of(
                "REGISTRO",
                "OPERACION",
                "PAGO"
        ).contains(fechaReferencia)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Fecha de referencia inválida."
            );
        }

        if (clienteId != null && clienteId <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cliente inválido."
            );
        }

        if (
                anio != null &&
                        (anio < 1900 || anio > 2100)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Año fuera de rango."
            );
        }

        if (
                mes != null &&
                        (mes < 1 || mes > 12 || anio == null)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Para filtrar por mes, primero selecciona un año."
            );
        }

        if (
                fechaDesde != null &&
                        fechaHasta != null &&
                        fechaDesde.isAfter(fechaHasta)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha inicial no puede ser posterior a la final."
            );
        }

        if (buscar.length() > 200) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Búsqueda demasiado larga."
            );
        }
    }

    private LocalDate inicio() {

        LocalDate inicio = fechaDesde;

        if (anio != null) {

            LocalDate periodo = LocalDate.of(
                    anio,
                    mes == null ? 1 : mes,
                    1
            );

            if (
                    inicio == null ||
                            periodo.isAfter(inicio)
            ) {
                inicio = periodo;
            }
        }

        return inicio;
    }

    private LocalDate fin() {

        LocalDate fin = fechaHasta;

        if (anio != null) {

            LocalDate periodo = mes == null
                    ? LocalDate.of(anio, 12, 31)
                    : LocalDate.of(anio, mes, 1)
                    .plusMonths(1)
                    .minusDays(1);

            if (
                    fin == null ||
                            periodo.isBefore(fin)
            ) {
                fin = periodo;
            }
        }

        return fin;
    }

    public Specification<Ingreso> especificacion(
            Long empresaId
    ) {

        return (raiz, consulta, cb) -> {

            List<Predicate> condiciones =
                    new ArrayList<>();

            // Nunca consultar ingresos de otra empresa.

            condiciones.add(
                    cb.equal(
                            raiz.get("empresa").get("id"),
                            empresaId
                    )
            );

            // ==================================
            // BUSCAR POR CLIENTE O FOLIO
            // ==================================

            if (!buscar.isBlank()) {

                String termino = buscar
                        .toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");

                String patron = "%" + termino + "%";

                Join<Ingreso, Cliente> cliente =
                        raiz.join(
                                "cliente",
                                JoinType.LEFT
                        );

                condiciones.add(
                        cb.or(
                                cb.like(
                                        cb.lower(
                                                raiz.get("folio")
                                        ),
                                        patron,
                                        '\\'
                                ),

                                cb.like(
                                        cb.lower(
                                                cliente.get("nombre")
                                        ),
                                        patron,
                                        '\\'
                                )
                        )
                );
            }

            // ==================================
            // CLIENTE ESPECIFICO
            // ==================================

            if (clienteId != null) {

                condiciones.add(
                        cb.equal(
                                raiz.get("cliente").get("id"),
                                clienteId
                        )
                );
            }

            // ==================================
            // ESTADO
            // ==================================

            if (estado.equals("CANCELADO")) {

                condiciones.add(
                        cb.equal(
                                raiz.get("estado"),
                                EstadoIngreso.CANCELADO
                        )
                );

            } else if (!estado.isBlank()) {

                condiciones.add(
                        cb.equal(
                                raiz.get("estado"),
                                EstadoIngreso.REGISTRADO
                        )
                );

                condiciones.add(
                        cb.equal(
                                raiz.get("estadoPago"),
                                EstadoPagoIngreso.valueOf(estado)
                        )
                );
            }

            // ==================================
            // FECHAS
            // ==================================

            LocalDate desde = inicio();
            LocalDate hasta = fin();

            if (
                    desde != null &&
                            hasta != null &&
                            desde.isAfter(hasta)
            ) {
                return cb.disjunction();
            }

            if (fechaReferencia.equals("REGISTRO")) {

                if (desde != null) {

                    OffsetDateTime inicioFecha = desde
                            .atStartOfDay(ZONA)
                            .toOffsetDateTime();

                    condiciones.add(
                            cb.greaterThanOrEqualTo(
                                    raiz.get("creadoEn"),
                                    inicioFecha
                            )
                    );
                }

                if (hasta != null) {

                    OffsetDateTime finExclusivo = hasta
                            .plusDays(1)
                            .atStartOfDay(ZONA)
                            .toOffsetDateTime();

                    condiciones.add(
                            cb.lessThan(
                                    raiz.get("creadoEn"),
                                    finExclusivo
                            )
                    );
                }

            } else {

                String columna = fechaReferencia.equals("PAGO")
                        ? "fechaPago"
                        : "fecha";

                if (desde != null) {

                    condiciones.add(
                            cb.greaterThanOrEqualTo(
                                    raiz.get(columna),
                                    desde
                            )
                    );
                }

                if (hasta != null) {

                    condiciones.add(
                            cb.lessThanOrEqualTo(
                                    raiz.get(columna),
                                    hasta
                            )
                    );
                }
            }

            return cb.and(
                    condiciones.toArray(new Predicate[0])
            );
        };
    }
}
