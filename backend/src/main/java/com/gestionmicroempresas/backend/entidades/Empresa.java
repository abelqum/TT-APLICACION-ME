
package com.gestionmicroempresas.backend.entidades;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "nombre",
            nullable = false,
            length = 200
    )
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "estado",
            nullable = false,
            length = 20
    )
    private EstadoEmpresa estado;

    @CreationTimestamp
    @Column(
            name = "creado_en",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime creadoEn;

    @UpdateTimestamp
    @Column(
            name = "actualizado_en",
            nullable = false
    )
    private OffsetDateTime actualizadoEn;

    // Constructor requerido por JPA
    protected Empresa() {
    }

    // Constructor para registrar empresas
    public Empresa(String nombre) {
        this.nombre = nombre;
        this.estado = EstadoEmpresa.ACTIVA;
    }

    // Metodos de consulta

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public EstadoEmpresa getEstado() {
        return estado;
    }

    public OffsetDateTime getCreadoEn() {
        return creadoEn;
    }

    public OffsetDateTime getActualizadoEn() {
        return actualizadoEn;
    }

    // Metodos de modificacion

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEstado(EstadoEmpresa estado) {
        this.estado = estado;
    }
}
