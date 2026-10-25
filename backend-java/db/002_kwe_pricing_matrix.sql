-- Pricing matrices saved from the admin Pricing Matrix screens.
-- The matrix body (lanes, rate breaks, surcharges) is stored as JSONB so each matrix type keeps its own shape.

CREATE TABLE IF NOT EXISTS quoteownr.kwe_pricing_matrix (
    matrix_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    matrix_type  VARCHAR(20)  NOT NULL,
    matrix_code  VARCHAR(40)  NOT NULL,
    name         VARCHAR(200) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    data         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    version      INTEGER      NOT NULL DEFAULT 0,
    created_by   VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_by   VARCHAR(255) NOT NULL,
    updated_at   TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    CONSTRAINT kwe_pricing_matrix_code_uk UNIQUE (matrix_code),
    CONSTRAINT kwe_pricing_matrix_type_ck CHECK (matrix_type IN ('AIR', 'LCL', 'FCL', 'SURCHARGE')),
    CONSTRAINT kwe_pricing_matrix_status_ck CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS kwe_pricing_matrix_type_ix ON quoteownr.kwe_pricing_matrix (matrix_type);
