
package com.gestionmicroempresas.backend.repositorios;

import com.gestionmicroempresas.backend.entidades.Usuario;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.gestionmicroempresas.backend.entidades.Rol;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepositorio
        extends JpaRepository<Usuario, Long> {

    // Buscar por correo y cargar la empresa.
    @EntityGraph(attributePaths = {"empresa"})
    Optional<Usuario> findByCorreoIgnoreCase(
            String correo
    );

    // Comprobar si existe un correo.
    boolean existsByCorreoIgnoreCase(
            String correo
    );

    // Listar usuarios de una empresa.
    List<Usuario> findAllByEmpresa_IdOrderByNombreAsc(
            Long empresaId
    );

    // Buscar usuario y cargar su empresa
    // en una sola consulta mediante JOIN FETCH.
    @Query("""
            SELECT u
            FROM Usuario u
            JOIN FETCH u.empresa
            WHERE u.id = :usuarioId
              AND u.empresa.id = :empresaId
            """)
    Optional<Usuario> findByIdAndEmpresa_Id(
            @Param("usuarioId") Long usuarioId,
            @Param("empresaId") Long empresaId
    );


    List<Usuario> findAllByEmpresa_IdAndRolOrderByNombreAsc(
            Long empresaId,
            Rol rol
    );

}
