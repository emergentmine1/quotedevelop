package com.kwe.quote.security;

import java.util.Optional;

/** Application roles stored in quoteownr.kwe_admin_users.role. */
public enum AdminRole {
    READ_ONLY,
    READ_WRITE;

    /** Spring authority name, used by hasRole("READ_WRITE"). */
    public String authority() {
        return "ROLE_" + name();
    }

    /** Unknown or blank values give empty, so an invalid role in the table never grants access. */
    public static Optional<AdminRole> parse(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (AdminRole role : values()) {
            if (role.name().equals(value.trim())) {
                return Optional.of(role);
            }
        }
        return Optional.empty();
    }
}
