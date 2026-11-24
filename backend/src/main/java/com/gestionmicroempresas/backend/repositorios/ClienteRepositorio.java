
package com.gestionmicroempresas.backend.repositorios;

import com.gestionmicroempresas.backend.entidades.Cliente;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepositorio
        extends JpaRepository<Cliente, Long> {

    Page<Cliente> findAllByEmpresa_IdAndActivoTrueOrderByNombreAsc(
            Long empresaId,
            Pageable paginacion
    );

    Optional<Cliente> findByIdAndEmpresa_Id(
            Long clienteId,
            Long empresaId
    );

    Page<Cliente> findAllByEmpresa_IdAndActivoTrueAndNombreContainingIgnoreCaseOrderByNombreAsc(
            Long empresaId,
            String nombre,
            Pageable paginacion
    );
}
