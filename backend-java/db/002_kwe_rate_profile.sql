-- Rate Profiles (header) and their Rate Matrix (detail rows).
-- Run BEFORE `mvn compile`: jOOQ codegen reads these tables. Idempotent.

-- Needed so the exclusion constraint can mix "=" on text columns with "&&" on date ranges.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS quoteownr.kwe_rate_profile (
    profile_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_code        VARCHAR(20),
    category            VARCHAR(10)   NOT NULL,
    charge_code         VARCHAR(20)   NOT NULL,
    carrier_code        VARCHAR(20)   NOT NULL,
    transport_mode      VARCHAR(10)   NOT NULL,
    service_type        VARCHAR(30)   NOT NULL,
    origin_port         VARCHAR(10)   NOT NULL,
    calculation_method  VARCHAR(20)   NOT NULL,
    currency_code       VARCHAR(3)    NOT NULL,
    effective_date      DATE          NOT NULL,
    expiration_date     DATE          NOT NULL,
    external_markup     NUMERIC(5,2),
    internal_markup     NUMERIC(5,2),
    status              VARCHAR(10)   NOT NULL DEFAULT 'DRAFT',
    remarks             VARCHAR(500),
    weight_breaks       JSONB         NOT NULL DEFAULT '[]'::jsonb,
    version             INTEGER       NOT NULL DEFAULT 1,
    created_by          VARCHAR(255)  NOT NULL,
    created_at          TIMESTAMP     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_by          VARCHAR(255)  NOT NULL,
    updated_at          TIMESTAMP     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    CONSTRAINT kwe_rate_profile_code_uk UNIQUE (profile_code),
    CONSTRAINT kwe_rate_profile_category_ck CHECK (
        (category = 'freight' AND charge_code IN ('FRTRV', 'FSCRV', 'SECFEERV')) OR
        (category = 'origin'  AND charge_code IN ('CUSTCLRV', 'CARTAGERV', 'PKPRV', 'HANRV', 'IORV', 'CPRV'))),
    CONSTRAINT kwe_rate_profile_calc_ck CHECK (calculation_method IN ('FLAT', 'WEIGHT', 'FLAT_WEIGHT')),
    CONSTRAINT kwe_rate_profile_status_ck CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
    CONSTRAINT kwe_rate_profile_dates_ck CHECK (expiration_date >= effective_date),
    CONSTRAINT kwe_rate_profile_markup_ck CHECK (
        (external_markup IS NULL OR external_markup BETWEEN 0 AND 100) AND
        (internal_markup IS NULL OR internal_markup BETWEEN 0 AND 100)),
    -- The business rule: never two ACTIVE profiles for the same key with overlapping validity.
    CONSTRAINT kwe_rate_profile_no_active_overlap EXCLUDE USING gist (
        charge_code WITH =, carrier_code WITH =, transport_mode WITH =, service_type WITH =, origin_port WITH =,
        daterange(effective_date, expiration_date, '[]') WITH &&
    ) WHERE (status = 'ACTIVE')
);

CREATE INDEX IF NOT EXISTS kwe_rate_profile_category_updated_ix
    ON quoteownr.kwe_rate_profile (category, updated_at DESC);

CREATE TABLE IF NOT EXISTS quoteownr.kwe_rate_matrix (
    matrix_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id   BIGINT        NOT NULL REFERENCES quoteownr.kwe_rate_profile (profile_id) ON DELETE CASCADE,
    line_no      INTEGER       NOT NULL,
    dest_port    VARCHAR(10)   NOT NULL,
    flat_amount  NUMERIC(14,4),
    min_amount   NUMERIC(14,4),
    max_amount   NUMERIC(14,4),
    rates        JSONB         NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT kwe_rate_matrix_dest_uk UNIQUE (profile_id, dest_port),
    CONSTRAINT kwe_rate_matrix_amounts_ck CHECK (
        (flat_amount IS NULL OR flat_amount >= 0) AND (min_amount IS NULL OR min_amount >= 0) AND
        (max_amount IS NULL OR max_amount >= 0) AND
        (min_amount IS NULL OR max_amount IS NULL OR min_amount < max_amount))
);
