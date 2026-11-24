
package com.gestionmicroempresas.backend.entidades;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "detalles_ingreso")
public class DetalleIngreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingreso_id", nullable = false)
    private Ingreso ingreso;

    // Referencia preparada para Inventario en TT2.
    // Todavia no existe una tabla de articulos.
    @Column(name = "articulo_id")
    private Long articuloId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_concepto", nullable = false, length = 20)
    private TipoConceptoIngreso tipoConcepto;

    @Column(name = "clave_articulo", length = 100)
    private String claveArticulo;

    @Column(name = "concepto", nullable = false, length = 200)
    private String concepto;

    @Column(name = "unidad_medida", nullable = false, length = 40)
    private String unidadMedida;

    @Column(
            name = "cantidad",
            nullable = false,
            precision = 12,
            scale = 3
    )
    private BigDecimal cantidad;

    // El precio ya incluye el IVA correspondiente.
    @Column(
            name = "precio_unitario",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal precioUnitario;

    @Column(
            name = "tasa_iva",
            nullable = false,
            precision = 5,
            scale = 4
    )
    private BigDecimal tasaIva;

    @Column(
            name = "subtotal",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal subtotal;

    @Column(
            name = "iva",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal iva;

    @Column(
            name = "total",
            nullable = false,
            precision = 14,
            scale = 2
    )
    private BigDecimal total;

    // Constructor requerido por JPA
    protected DetalleIngreso() {
    }

    // Constructor para agregar un concepto a un ingreso
    public DetalleIngreso(
            Empresa empresa,
            Ingreso ingreso,
            Long articuloId,
            TipoConceptoIngreso tipoConcepto,
            String claveArticulo,
            String concepto,
            String unidadMedida,
            BigDecimal cantidad,
            BigDecimal precioUnitario,
            BigDecimal tasaIva,
            BigDecimal subtotal,
            BigDecimal iva,
            BigDecimal total
    ) {
        this.empresa = empresa;
        this.ingreso = ingreso;
        this.articuloId = articuloId;
        this.tipoConcepto = tipoConcepto;
        this.claveArticulo = claveArticulo;
        this.concepto = concepto;
        this.unidadMedida = unidadMedida;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.tasaIva = tasaIva;
        this.subtotal = subtotal;
        this.iva = iva;
        this.total = total;
    }

    // Getters

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public Ingreso getIngreso() {
        return ingreso;
    }

    public Long getArticuloId() {
        return articuloId;
    }

    public TipoConceptoIngreso getTipoConcepto() {
        return tipoConcepto;
    }

    public String getClaveArticulo() {
        return claveArticulo;
    }

    public String getConcepto() {
        return concepto;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public BigDecimal getTasaIva() {
        return tasaIva;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getIva() {
        return iva;
    }

    public BigDecimal getTotal() {
        return total;
    }
}
