-- Authorized KWE admin users and their application role.
-- Run BEFORE `mvn compile`: jOOQ codegen reads this table from the database.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS quoteownr.kwe_admin_users (
    user_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(20),
    is_active   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at  TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    CONSTRAINT kwe_admin_users_email_uk UNIQUE (email),
    CONSTRAINT kwe_admin_users_email_normalized_ck CHECK (email = lower(btrim(email)) AND email <> ''),
    CONSTRAINT kwe_admin_users_role_ck CHECK (role IN ('READ_ONLY', 'READ_WRITE')),
    -- An active user must have an explicit role.
    CONSTRAINT kwe_admin_users_active_role_ck CHECK (is_active = FALSE OR role IS NOT NULL)
);

COMMENT ON TABLE quoteownr.kwe_admin_users IS 'Users allowed into KWE Instant Quote Admin. No passwords: identity comes from Okta / Entra ID.';
