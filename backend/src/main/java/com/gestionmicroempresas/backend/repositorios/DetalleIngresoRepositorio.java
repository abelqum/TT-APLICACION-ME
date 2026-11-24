
package com.gestionmicroempresas.backend.repositorios;

import com.gestionmicroempresas.backend.entidades.DetalleIngreso;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DetalleIngresoRepositorio
        extends JpaRepository<DetalleIngreso, Long> {

    // Consultar los conceptos de una operacion.

    List<DetalleIngreso>
    findAllByEmpresa_IdAndIngreso_IdOrderByIdAsc(
            Long empresaId,
            Long ingresoId
    );

    // Eliminar los detalles anteriores para
    // sustituirlos por los nuevos dentro de
    // la misma transaccion de actualizacion.

    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM DetalleIngreso d
            WHERE d.empresa.id = :empresaId
              AND d.ingreso.id = :ingresoId
            """)
    int eliminarPorIngreso(
            @Param("empresaId") Long empresaId,
            @Param("ingresoId") Long ingresoId
    );
}
