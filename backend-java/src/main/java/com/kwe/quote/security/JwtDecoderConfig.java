package com.kwe.quote.security;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/** Exactly one decoder per mode, so a static HS256 token is never accepted in Okta mode. */
@Configuration
public class JwtDecoderConfig {

    public static final String STATIC_ISSUER = "kwe-static";
    private static final Logger log = LoggerFactory.getLogger(JwtDecoderConfig.class);

    @Bean
    public JwtDecoder jwtDecoder(AuthProperties props) {
        if (props.isStatic()) {
            log.warn("KWE_AUTH_MODE=static: dummy logins are enabled. Never use this in production.");
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(staticKey(props))
                    .macAlgorithm(MacAlgorithm.HS256).build();
            decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(STATIC_ISSUER));
            return decoder;
        }
        if (!AuthProperties.MODE_OKTA.equalsIgnoreCase(props.mode())) {
            throw new IllegalStateException("KWE_AUTH_MODE must be okta or static, got: " + props.mode());
        }
        String issuer = props.okta().issuer();
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("OKTA_ISSUER is required when KWE_AUTH_MODE=okta");
        }
        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<java.util.List<String>>("aud",
                aud -> aud != null && aud.contains(props.okta().audience()));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audience));
        return decoder;
    }

    static SecretKey staticKey(AuthProperties props) {
        String secret = props.staticLogin().jwtSecret();
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("STATIC_JWT_SECRET must be at least 32 characters in static mode");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
}
