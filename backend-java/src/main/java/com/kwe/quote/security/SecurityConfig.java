package com.kwe.quote.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

import static com.kwe.quote.security.AdminRole.READ_ONLY;
import static com.kwe.quote.security.AdminRole.READ_WRITE;

/**
 * Stateless bearer-token API. Public quote-form endpoints stay open; every admin endpoint needs a
 * validated token AND an active role from kwe_admin_users. 401 = no/invalid token, 403 = no role.
 * CSRF is off because no cookie carries the credential: the token is sent in the Authorization header.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, DbRoleJwtConverter converter,
            ProblemAuthHandlers handlers) throws Exception {
        String ro = READ_ONLY.name();
        String rw = READ_WRITE.name();
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(handlers).accessDeniedHandler(handlers))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public quote form
                        .requestMatchers(HttpMethod.GET, "/api/v1/masterdata/**", "/api/v1/profiledata/**",
                                "/ping").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/quote-requests").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/static-login").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info", "/swagger-ui.html",
                                "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Admin
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/quote-requests").hasAnyRole(ro, rw)
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/quote-requests/*/status").hasRole(rw)
                        .requestMatchers("/api/v1/rate-profiles", "/api/v1/rate-profiles/**").hasRole(rw)
                        .anyRequest().denyAll())
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint(handlers)
                        .accessDeniedHandler(handlers));
        return http.build();
    }
}
