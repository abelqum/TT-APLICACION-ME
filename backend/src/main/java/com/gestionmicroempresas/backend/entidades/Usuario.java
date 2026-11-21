
package com.gestionmicroempresas.backend.entidades;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "empresa_id",
            nullable = false
    )
    private Empresa empresa;

    @Column(
            name = "nombre",
            nullable = false,
            length = 150
    )
    private String nombre;

    @Column(
            name = "correo",
            nullable = false,
            length = 200
    )
    private String correo;

    @Column(
            name = "contrasena_hash",
            nullable = false,
            length = 255
    )
    private String contrasenaHash;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "rol",
            nullable = false,
            length = 20
    )
    private Rol rol;

    @Column(
            name = "activo",
            nullable = false
    )
    private boolean activo;

    @Column(
            name = "debe_cambiar_contrasena",
            nullable = false
    )
    private boolean debeCambiarContrasena;

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
    protected Usuario() {
    }

    // Constructor para registrar usuarios
    public Usuario(
            Empresa empresa,
            String nombre,
            String correo,
            String contrasenaHash,
            Rol rol
    ) {
        this.empresa = empresa;
        this.nombre = nombre;
        this.correo = correo;
        this.contrasenaHash = contrasenaHash;
        this.rol = rol;
        this.activo = true;
        this.debeCambiarContrasena = false;
    }

    // Metodos de consulta

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public String getNombre() {
        return nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public String getContrasenaHash() {
        return contrasenaHash;
    }

    public Rol getRol() {
        return rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public boolean isDebeCambiarContrasena() {
        return debeCambiarContrasena;
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

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public void setContrasenaHash(String contrasenaHash) {
        this.contrasenaHash = contrasenaHash;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public void setDebeCambiarContrasena(
            boolean debeCambiarContrasena
    ) {
        this.debeCambiarContrasena =
                debeCambiarContrasena;
    }
}
