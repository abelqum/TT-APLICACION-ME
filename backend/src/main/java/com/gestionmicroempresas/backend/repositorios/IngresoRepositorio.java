
package com.gestionmicroempresas.backend.repositorios;

import com.gestionmicroempresas.backend.entidades.Ingreso;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface IngresoRepositorio
        extends JpaRepository<Ingreso, Long>,
        JpaSpecificationExecutor<Ingreso> {

    @EntityGraph(attributePaths = {
            "cliente",
            "registradoPor"
    })
    Page<Ingreso> findAllByEmpresa_IdOrderByFechaDescIdDesc(
            Long empresaId,
            Pageable paginacion
    );

    @EntityGraph(attributePaths = {
            "cliente",
            "registradoPor"
    })
    Optional<Ingreso> findByIdAndEmpresa_Id(
            Long ingresoId,
            Long empresaId
    );
}
