
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
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ingresos")
public class Ingreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // RELACIONES
    // ==========================================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registrado_por_id", nullable = false)
    private Usuario registradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // ==========================================
    // FOLIO AUTOMATICO
    // ==========================================

    @Generated(event = EventType.INSERT)
    @Column(
            name = "folio",
            nullable = false,
            length = 30,
            insertable = false,
            updatable = false
    )
    private String folio;

    // ==========================================
    // FECHAS
    // ==========================================

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    // ==========================================
    // IMPORTES
    // ==========================================

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

    // ==========================================
    // ESTADO Y METODO DE PAGO
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(
            name = "estado_pago",
            nullable = false,
            length = 20
    )
    private EstadoPagoIngreso estadoPago;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "metodo_pago",
            length = 25
    )
    private MetodoPagoIngreso metodoPago;

    // ==========================================
    // FACTURACION EXTERNA
    // ==========================================

    @Column(name = "tiene_factura", nullable = false)
    private boolean tieneFactura;

    @Column(name = "numero_factura", length = 100)
    private String numeroFactura;

    @Column(name = "uuid_fiscal", length = 36)
    private String uuidFiscal;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    // ==========================================
    // ESTADO DEL INGRESO E INVENTARIO
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(
            name = "estado",
            nullable = false,
            length = 20
    )
    private EstadoIngreso estado;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "estado_integracion_inventario",
            nullable = false,
            length = 25
    )
    private EstadoIntegracionInventario estadoIntegracionInventario;

    // ==========================================
    // AUDITORIA
    // ==========================================

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

    // Constructor requerido por JPA.

    protected Ingreso() {
    }

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public Ingreso(
            Empresa empresa,
            Usuario registradoPor,
            Cliente cliente,
            LocalDate fecha,
            BigDecimal subtotal,
            BigDecimal iva,
            BigDecimal total,
            EstadoPagoIngreso estadoPago,
            MetodoPagoIngreso metodoPago,
            boolean tieneFactura,
            String numeroFactura,
            String uuidFiscal,
            String observaciones,
            boolean contieneProductos,
            LocalDate fechaPago
    ) {

        this.empresa = empresa;
        this.registradoPor = registradoPor;
        this.cliente = cliente;

        this.fecha = fecha;
        this.fechaPago = fechaPago;

        this.subtotal = subtotal;
        this.iva = iva;
        this.total = total;

        this.estadoPago = estadoPago;
        this.metodoPago = metodoPago;

        this.tieneFactura = tieneFactura;
        this.numeroFactura = numeroFactura;
        this.uuidFiscal = uuidFiscal;
        this.observaciones = observaciones;

        this.estado = EstadoIngreso.REGISTRADO;

        this.estadoIntegracionInventario = contieneProductos
                ? EstadoIntegracionInventario.SIN_INTEGRACION
                : EstadoIntegracionInventario.NO_APLICA;
    }

    // ==========================================
    // GETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public Usuario getRegistradoPor() {
        return registradoPor;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public String getFolio() {
        return folio;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public LocalDate getFechaPago() {
        return fechaPago;
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

    public EstadoPagoIngreso getEstadoPago() {
        return estadoPago;
    }

    public MetodoPagoIngreso getMetodoPago() {
        return metodoPago;
    }

    public boolean isTieneFactura() {
        return tieneFactura;
    }

    public String getNumeroFactura() {
        return numeroFactura;
    }

    public String getUuidFiscal() {
        return uuidFiscal;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public EstadoIngreso getEstado() {
        return estado;
    }

    public EstadoIntegracionInventario getEstadoIntegracionInventario() {
        return estadoIntegracionInventario;
    }

    public OffsetDateTime getCreadoEn() {
        return creadoEn;
    }

    public OffsetDateTime getActualizadoEn() {
        return actualizadoEn;
    }


    // ==========================================
    // MODIFICAR DATOS DE UN INGRESO
    // ==========================================

    public void actualizarDatos(
            Cliente cliente,
            LocalDate fecha,
            LocalDate fechaPago,
            BigDecimal subtotal,
            BigDecimal iva,
            BigDecimal total,
            EstadoPagoIngreso estadoPago,
            MetodoPagoIngreso metodoPago,
            boolean tieneFactura,
            String numeroFactura,
            String uuidFiscal,
            String observaciones,
            boolean contieneProductos
    ) {
        this.cliente = cliente;
        this.fecha = fecha;
        this.fechaPago = fechaPago;

        this.subtotal = subtotal;
        this.iva = iva;
        this.total = total;

        this.estadoPago = estadoPago;
        this.metodoPago = metodoPago;

        this.tieneFactura = tieneFactura;
        this.numeroFactura = numeroFactura;
        this.uuidFiscal = uuidFiscal;
        this.observaciones = observaciones;

        this.estadoIntegracionInventario = contieneProductos
                ? EstadoIntegracionInventario.SIN_INTEGRACION
                : EstadoIntegracionInventario.NO_APLICA;
        this.actualizadoEn = OffsetDateTime.now();
    }

    // ==========================================
    // CANCELACION LOGICA
    // ==========================================

    public void cancelar() {
        this.estado = EstadoIngreso.CANCELADO;
    }

}
