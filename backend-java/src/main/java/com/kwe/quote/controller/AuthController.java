package com.kwe.quote.controller;

import java.util.Map;

import com.kwe.quote.security.AdminRole;
import com.kwe.quote.security.AuthProperties;
import com.kwe.quote.security.StaticTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Who am I (both modes) and the temporary static login (static mode only). */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Admin session and role")
public class AuthController {

    public record StaticLoginRequest(@NotBlank @Size(max = 255) String email,
            @NotBlank @Size(max = 200) String password) {
    }

    public record MeResponse(String email, AdminRole role) {
    }

    private static final String NOT_AUTHORIZED = "You are not authorized to access the KWE Instant Quote "
            + "Admin application. Please contact your administrator.";

    private final StaticTokenService staticTokenService;
    private final AuthProperties authProperties;

    public AuthController(StaticTokenService staticTokenService, AuthProperties authProperties) {
        this.staticTokenService = staticTokenService;
        this.authProperties = authProperties;
    }

    @Operation(summary = "Current user and role, resolved server-side from kwe_admin_users",
            description = "401 when the token is missing or invalid, 403 when the user has no active role.")
    @GetMapping("/me")
    public ResponseEntity<?> me(JwtAuthenticationToken authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replaceFirst("^ROLE_", ""))
                .map(AdminRole::parse)
                .flatMap(java.util.Optional::stream)
                .findFirst()
                .<ResponseEntity<?>>map(role -> ResponseEntity.ok(new MeResponse(authentication.getName(), role)))
                .orElseGet(() -> problem(HttpStatus.FORBIDDEN, NOT_AUTHORIZED));
    }

    @Operation(summary = "TEMPORARY dummy login (KWE_AUTH_MODE=static only)")
    @PostMapping("/static-login")
    public ResponseEntity<?> staticLogin(@Valid @RequestBody StaticLoginRequest body) {
        if (!authProperties.isStatic()) {
            return problem(HttpStatus.NOT_FOUND, "Not available.");
        }
        return staticTokenService.login(body.email(), body.password())
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(Map.of(
                        "accessToken", t.accessToken(),
                        "tokenType", "Bearer",
                        "expiresIn", t.expiresIn(),
                        "email", t.email(),
                        "role", t.role())))
                // Same answer for wrong password, unknown, inactive or role-less users.
                .orElseGet(() -> problem(HttpStatus.UNAUTHORIZED, "Invalid credentials or not authorized."));
    }

    private ResponseEntity<ProblemDetail> problem(HttpStatus status, String detail) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detail);
        p.setTitle(status.getReasonPhrase());
        return ResponseEntity.status(status).body(p);
    }
}
