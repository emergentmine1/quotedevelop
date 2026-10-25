package com.kwe.quote.security;

import java.util.Locale;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import com.kwe.quote.repository.AdminUserRepository;

/**
 * Resolves the role for a verified email. Fails closed: no row, inactive, invalid role or a
 * database error all give empty, and empty never grants access.
 */
@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserRepository repository;

    public AdminUserService(AdminUserRepository repository) {
        this.repository = repository;
    }

    public static String normalise(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim().toLowerCase(Locale.ROOT);
        return trimmed.isEmpty() ? null : trimmed;
    }

    public Optional<AdminRole> resolveRole(String rawEmail) {
        String email = normalise(rawEmail);
        if (email == null) {
            return Optional.empty();
        }
        try {
            return repository.findByEmail(email)
                    .filter(AdminUserRepository.AdminUserRow::active)
                    .flatMap(row -> AdminRole.parse(row.role()));
        } catch (DataAccessException e) {
            log.error("Admin user lookup failed; denying access", e);
            return Optional.empty();
        }
    }
}
