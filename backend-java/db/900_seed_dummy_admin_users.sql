-- DUMMY users for local / static-login testing only. Do not run in production.
-- Static-login password is the STATIC_LOGIN_PASSWORD env var (never stored here).

INSERT INTO quoteownr.kwe_admin_users (email, role, is_active) VALUES
    ('reader@kwe.com',   'READ_ONLY',  TRUE),
    ('writer@kwe.com',   'READ_WRITE', TRUE),
    ('inactive@kwe.com', 'READ_WRITE', FALSE)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active,
    updated_at = (now() AT TIME ZONE 'UTC');

-- 'outsider@kwe.com' deliberately has no row: it must be denied.
