package com.kwe.quote.security;

import java.util.List;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Runs after the token signature, issuer, audience and expiry are validated. The role comes from
 * the database on every request, so a role change or deactivation applies immediately. A user
 * without an active role is authenticated but has no authority, so every protected API gives 403.
 */
@Component
public class DbRoleJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AdminUserService adminUserService;
    private final AuthProperties authProperties;

    public DbRoleJwtConverter(AdminUserService adminUserService, AuthProperties authProperties) {
        this.adminUserService = adminUserService;
        this.authProperties = authProperties;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String email = AdminUserService.normalise(emailOf(jwt));
        List<GrantedAuthority> authorities = adminUserService.resolveRole(email)
                .<List<GrantedAuthority>>map(role -> List.of(new SimpleGrantedAuthority(role.authority())))
                .orElse(List.of());
        return new JwtAuthenticationToken(jwt, authorities, email == null ? jwt.getSubject() : email);
    }

    private String emailOf(Jwt jwt) {
        for (String claim : authProperties.emailClaims()) {
            String value = jwt.getClaimAsString(claim.trim());
            if (value != null && value.contains("@")) {
                return value;
            }
        }
        return null;
    }
}
