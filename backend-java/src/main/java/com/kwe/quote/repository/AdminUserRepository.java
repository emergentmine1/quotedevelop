package com.kwe.quote.repository;

import java.util.Optional;

import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import static com.kwe.quote.jooq.tables.KweAdminUsers.KWE_ADMIN_USERS;

/** Reads quoteownr.kwe_admin_users. Parameterised by jOOQ, so the email is never concatenated into SQL. */
@Repository
public class AdminUserRepository {

    public record AdminUserRow(String email, String role, boolean active) {
    }

    private final DSLContext dsl;

    public AdminUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Caller passes an already normalised email. */
    public Optional<AdminUserRow> findByEmail(String normalisedEmail) {
        return dsl.select(KWE_ADMIN_USERS.EMAIL, KWE_ADMIN_USERS.ROLE, KWE_ADMIN_USERS.IS_ACTIVE)
                .from(KWE_ADMIN_USERS)
                .where(KWE_ADMIN_USERS.EMAIL.eq(normalisedEmail))
                .fetchOptional(r -> new AdminUserRow(r.value1(), r.value2(), Boolean.TRUE.equals(r.value3())));
    }
}
