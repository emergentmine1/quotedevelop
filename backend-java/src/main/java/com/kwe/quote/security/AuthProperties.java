package com.kwe.quote.security;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** kwe.auth.* settings. Every value comes from the environment, see application.yml. */
@ConfigurationProperties(prefix = "kwe.auth")
public record AuthProperties(String mode, List<String> emailClaims, Okta okta, StaticLogin staticLogin) {

    public static final String MODE_OKTA = "okta";
    public static final String MODE_STATIC = "static";

    public boolean isStatic() {
        return MODE_STATIC.equalsIgnoreCase(mode);
    }

    public record Okta(String issuer, String audience) {
    }

    public record StaticLogin(String jwtSecret, String password, int ttlMinutes) {
    }
}
