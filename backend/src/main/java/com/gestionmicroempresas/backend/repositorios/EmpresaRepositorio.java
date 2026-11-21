
package com.gestionmicroempresas.backend.repositorios;

import com.gestionmicroempresas.backend.entidades.Empresa;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepositorio
        extends JpaRepository<Empresa, Long> {

}
