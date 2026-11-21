
-- INCREMENTO 1: AUTENTICACION
-- MIGRACION V1: EMPRESAS Y USUARIOS

CREATE TABLE empresas (
                          id BIGSERIAL PRIMARY KEY,
                          nombre VARCHAR(200) NOT NULL,
                          estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
                          creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT chk_empresas_nombre
                              CHECK (BTRIM(nombre) <> ''),

                          CONSTRAINT chk_empresas_estado
                              CHECK (estado IN ('ACTIVA', 'SUSPENDIDA'))
);

CREATE TABLE usuarios (
                          id BIGSERIAL PRIMARY KEY,
                          empresa_id BIGINT NOT NULL,
                          nombre VARCHAR(150) NOT NULL,
                          correo VARCHAR(200) NOT NULL,
                          contrasena_hash VARCHAR(255) NOT NULL,
                          rol VARCHAR(20) NOT NULL,
                          activo BOOLEAN NOT NULL DEFAULT TRUE,
                          debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE,
                          creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_usuarios_empresa
                              FOREIGN KEY (empresa_id)
                                  REFERENCES empresas(id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT chk_usuarios_nombre
                              CHECK (BTRIM(nombre) <> ''),

                          CONSTRAINT chk_usuarios_rol
                              CHECK (rol IN ('ADMIN', 'EMPLEADO')),

                          CONSTRAINT uq_usuarios_empresa_id
                              UNIQUE (empresa_id, id)
);

CREATE UNIQUE INDEX uq_usuarios_correo
    ON usuarios (LOWER(correo));

CREATE INDEX idx_usuarios_empresa
    ON usuarios (empresa_id);
