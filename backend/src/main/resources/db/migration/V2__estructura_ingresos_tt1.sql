
-- ==================================================
-- TRABAJO TERMINAL 1
-- INCREMENTO 2: INGRESOS Y CLIENTES
-- ==================================================
-- El inventario se implementara en TT2.
-- Los precios guardados son finales, con IVA incluido.
-- ==================================================

-- IMPORTANTE:
-- La restriccion UNIQUE (empresa_id, id) de usuarios
-- ya existe en nuestra base de datos.
-- No se vuelve a crear para evitar duplicados.


-- ==================================================
-- 1. CLIENTES
-- ==================================================

CREATE TABLE clientes (

                          id BIGSERIAL PRIMARY KEY,

                          empresa_id BIGINT NOT NULL,

                          nombre VARCHAR(200) NOT NULL,

                          rfc VARCHAR(13),
                          correo VARCHAR(200),
                          telefono VARCHAR(30),

                          activo BOOLEAN NOT NULL DEFAULT TRUE,

                          creado_en TIMESTAMPTZ NOT NULL
                                                  DEFAULT CURRENT_TIMESTAMP,

                          actualizado_en TIMESTAMPTZ NOT NULL
                                                  DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_clientes_empresa
                              FOREIGN KEY (empresa_id)
                                  REFERENCES empresas(id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT uq_clientes_empresa_id
                              UNIQUE (empresa_id, id),

                          CONSTRAINT chk_clientes_nombre
                              CHECK (BTRIM(nombre) <> '')

);

CREATE INDEX idx_clientes_empresa_nombre
    ON clientes (empresa_id, nombre);


-- ==================================================
-- 2. SECUENCIA DE FOLIOS
-- ==================================================

CREATE SEQUENCE secuencia_folios_ingresos
    START WITH 1
    INCREMENT BY 1;


-- ==================================================
-- 3. INGRESOS
-- ==================================================

CREATE TABLE ingresos (

                          id BIGSERIAL PRIMARY KEY,

                          empresa_id BIGINT NOT NULL,
                          registrado_por_id BIGINT NOT NULL,

    -- NULL representa Publico en general.
                          cliente_id BIGINT,

    -- Folio interno automatico.
                          folio VARCHAR(30) NOT NULL
                                                         DEFAULT (
                                                             'ING-' ||
                                                             LPAD(
                                                                     nextval('secuencia_folios_ingresos')::TEXT,
                                                                     8,
                                                                     '0'
                                                             )
                                                             ),

    -- Fecha de la operacion.
    -- Si hay factura, corresponde a la fecha capturada.
                          fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Fecha en que se recibio el pago.
    -- NULL cuando esta pendiente.
                          fecha_pago DATE,

    -- Importes calculados por el backend.
                          subtotal NUMERIC(14, 2) NOT NULL,
                          iva NUMERIC(14, 2) NOT NULL,
                          total NUMERIC(14, 2) NOT NULL,

    -- PAGADO o PENDIENTE.
                          estado_pago VARCHAR(20) NOT NULL
                                                         DEFAULT 'PAGADO',

    -- Solo cuando esta pagado.
                          metodo_pago VARCHAR(25),

    -- Factura externa.
                          tiene_factura BOOLEAN NOT NULL DEFAULT FALSE,

                          numero_factura VARCHAR(100),
                          uuid_fiscal VARCHAR(36),

                          observaciones VARCHAR(1000),

    -- REGISTRADO o CANCELADO.
                          estado VARCHAR(20) NOT NULL
                                                         DEFAULT 'REGISTRADO',

    -- Preparacion para Inventario TT2.
                          estado_integracion_inventario VARCHAR(25)
                              NOT NULL DEFAULT 'NO_APLICA',

    -- Fecha y hora reales de creacion.
                          creado_en TIMESTAMPTZ NOT NULL
                                                         DEFAULT CURRENT_TIMESTAMP,

                          actualizado_en TIMESTAMPTZ NOT NULL
                                                         DEFAULT CURRENT_TIMESTAMP,

    -- ==============================================
    -- RELACIONES
    -- ==============================================

                          CONSTRAINT fk_ingresos_empresa
                              FOREIGN KEY (empresa_id)
                                  REFERENCES empresas(id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT fk_ingresos_usuario_empresa
                              FOREIGN KEY (empresa_id, registrado_por_id)
                                  REFERENCES usuarios(empresa_id, id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT fk_ingresos_cliente_empresa
                              FOREIGN KEY (empresa_id, cliente_id)
                                  REFERENCES clientes(empresa_id, id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT uq_ingresos_folio
                              UNIQUE (folio),

                          CONSTRAINT uq_ingresos_empresa_id
                              UNIQUE (empresa_id, id),

    -- ==============================================
    -- VALIDACIONES DE IMPORTES
    -- ==============================================

                          CONSTRAINT chk_ingresos_importes
                              CHECK (
                                  subtotal >= 0
                                      AND iva >= 0
                                      AND total > 0
                                      AND total = subtotal + iva
                                  ),

    -- ==============================================
    -- VALIDACIONES DEL PAGO
    -- ==============================================

                          CONSTRAINT chk_ingresos_estado_pago
                              CHECK (
                                  estado_pago IN (
                                                  'PAGADO',
                                                  'PENDIENTE'
                                      )
                                  ),

                          CONSTRAINT chk_ingresos_metodo_pago
                              CHECK (
                                  metodo_pago IS NULL
                                      OR metodo_pago IN (
                                                         'EFECTIVO',
                                                         'TRANSFERENCIA',
                                                         'TARJETA_DEBITO',
                                                         'TARJETA_CREDITO',
                                                         'OTRO'
                                      )
                                  ),

                          CONSTRAINT chk_ingresos_pago
                              CHECK (
                                  (
                                      estado_pago = 'PAGADO'
                                          AND metodo_pago IS NOT NULL
                                          AND fecha_pago IS NOT NULL
                                      )
                                      OR
                                  (
                                      estado_pago = 'PENDIENTE'
                                          AND metodo_pago IS NULL
                                          AND fecha_pago IS NULL
                                      )
                                  ),

    -- ==============================================
    -- VALIDACIONES DE FACTURACION
    -- ==============================================

                          CONSTRAINT chk_ingresos_factura
                              CHECK (
                                  (
                                      tiene_factura = FALSE
                                          AND cliente_id IS NULL
                                          AND numero_factura IS NULL
                                          AND uuid_fiscal IS NULL
                                          AND estado_pago = 'PAGADO'
                                      )
                                      OR
                                  (
                                      tiene_factura = TRUE
                                          AND cliente_id IS NOT NULL
                                          AND numero_factura IS NOT NULL
                                          AND BTRIM(numero_factura) <> ''
                                      )
                                  ),

    -- ==============================================
    -- ESTADO DEL INGRESO
    -- ==============================================

                          CONSTRAINT chk_ingresos_estado
                              CHECK (
                                  estado IN (
                                             'REGISTRADO',
                                             'CANCELADO'
                                      )
                                  ),

    -- ==============================================
    -- INTEGRACION CON INVENTARIO
    -- ==============================================

                          CONSTRAINT chk_ingresos_integracion
                              CHECK (
                                  estado_integracion_inventario IN (
                                                                    'NO_APLICA',
                                                                    'SIN_INTEGRACION',
                                                                    'APLICADO'
                                      )
                                  )

);


-- Historial paginado, del mas reciente al antiguo.

CREATE INDEX idx_ingresos_empresa_fecha
    ON ingresos (empresa_id, fecha DESC, id DESC);

CREATE INDEX idx_ingresos_empresa_cliente
    ON ingresos (empresa_id, cliente_id);


-- ==================================================
-- 4. DETALLES DE INGRESO
-- ==================================================

CREATE TABLE detalles_ingreso (

                                  id BIGSERIAL PRIMARY KEY,

                                  empresa_id BIGINT NOT NULL,
                                  ingreso_id BIGINT NOT NULL,

    -- Referencia reservada para el catalogo de TT2.
    -- Todavia no es una clave foranea.
                                  articulo_id BIGINT,

    -- PRODUCTO o SERVICIO.
                                  tipo_concepto VARCHAR(20) NOT NULL,

    -- Copia historica de los datos vendidos.
                                  clave_articulo VARCHAR(100),

                                  concepto VARCHAR(200) NOT NULL,

                                  unidad_medida VARCHAR(40) NOT NULL
                                      DEFAULT 'PIEZA',

                                  cantidad NUMERIC(12, 3) NOT NULL,

    -- Precio final con IVA incluido.
                                  precio_unitario NUMERIC(14, 2) NOT NULL,

                                  tasa_iva NUMERIC(5, 4) NOT NULL,

                                  subtotal NUMERIC(14, 2) NOT NULL,
                                  iva NUMERIC(14, 2) NOT NULL,
                                  total NUMERIC(14, 2) NOT NULL,

    -- ==============================================
    -- RELACIONES
    -- ==============================================

                                  CONSTRAINT fk_detalles_ingreso
                                      FOREIGN KEY (empresa_id, ingreso_id)
                                          REFERENCES ingresos(empresa_id, id)
                                          ON DELETE RESTRICT,

    -- ==============================================
    -- VALIDACIONES
    -- ==============================================

                                  CONSTRAINT chk_detalles_tipo
                                      CHECK (
                                          tipo_concepto IN (
                                                            'PRODUCTO',
                                                            'SERVICIO'
                                              )
                                          ),

                                  CONSTRAINT chk_detalles_concepto
                                      CHECK (BTRIM(concepto) <> ''),

                                  CONSTRAINT chk_detalles_cantidad
                                      CHECK (cantidad > 0),

                                  CONSTRAINT chk_detalles_precio
                                      CHECK (precio_unitario >= 0),

                                  CONSTRAINT chk_detalles_iva
                                      CHECK (
                                          tasa_iva >= 0
                                              AND tasa_iva <= 1
                                          ),

                                  CONSTRAINT chk_detalles_importes
                                      CHECK (
                                          subtotal >= 0
                                              AND iva >= 0
                                              AND total >= 0
                                              AND total = subtotal + iva
                                          )

);


CREATE INDEX idx_detalles_ingreso_empresa
    ON detalles_ingreso (empresa_id, ingreso_id);

CREATE INDEX idx_detalles_ingreso_articulo
    ON detalles_ingreso (empresa_id, articulo_id)
    WHERE articulo_id IS NOT NULL;
