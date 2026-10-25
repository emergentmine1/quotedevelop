package com.kwe.quote.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

/**
 * TEMPORARY dummy-login token issuer, active only when KWE_AUTH_MODE=static. Checks one shared
 * password from STATIC_LOGIN_PASSWORD (nothing is stored in the database) and still requires an
 * active kwe_admin_users row. Remove once Okta is configured.
 */
@Service
public class StaticTokenService {

    public record IssuedToken(String accessToken, long expiresIn, String email, AdminRole role) {
    }

    private final AuthProperties props;
    private final AdminUserService adminUserService;
    private final Clock clock;

    public StaticTokenService(AuthProperties props, AdminUserService adminUserService, Clock clock) {
        this.props = props;
        this.adminUserService = adminUserService;
        this.clock = clock;
    }

    /** Empty when the mode is not static, the password is wrong, or the user has no active role. */
    public Optional<IssuedToken> login(String rawEmail, String password) {
        if (!props.isStatic()) {
            return Optional.empty();
        }
        String expected = props.staticLogin().password();
        if (expected == null || expected.isEmpty() || password == null
                || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                        password.getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }
        String email = AdminUserService.normalise(rawEmail);
        return adminUserService.resolveRole(email).map(role -> issue(email, role));
    }

    private IssuedToken issue(String email, AdminRole role) {
        Instant now = Instant.now(clock);
        long ttlSeconds = Math.max(1, props.staticLogin().ttlMinutes()) * 60L;
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(JwtDecoderConfig.STATIC_ISSUER)
                .subject(email)
                .claim("email", email)
                .issuedAt(now)
                .expiresAt(now.plus(ttlSeconds, ChronoUnit.SECONDS))
                .build();
        NimbusJwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(JwtDecoderConfig.staticKey(props)));
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return new IssuedToken(token, ttlSeconds, email, role);
    }
}
