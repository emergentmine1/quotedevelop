package com.kwe.quote.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Pricing matrix DTOs. {@code data} holds the type-specific body exactly as the admin form sends it. */
public final class PricingMatrixDtos {

    private PricingMatrixDtos() {
    }

    public record PricingMatrix(long matrixId, String matrixType, String matrixCode, String name,
            String status, JsonNode data, int version, String createdBy, LocalDateTime createdAt,
            String updatedBy, LocalDateTime updatedAt) {
    }

    public record CreatePricingMatrix(
            @NotBlank @Pattern(regexp = "AIR|LCL|FCL|SURCHARGE") String matrixType,
            @NotBlank @Size(max = 40) @Pattern(regexp = "^[A-Za-z0-9_-]+$") String matrixCode,
            @NotBlank @Size(max = 200) String name,
            @Pattern(regexp = "DRAFT|ACTIVE|INACTIVE|EXPIRED") String status,
            @NotNull JsonNode data) {
    }

    /** {@code version} must match the stored row, otherwise 409 (someone else saved first). */
    public record UpdatePricingMatrix(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Pattern(regexp = "DRAFT|ACTIVE|INACTIVE|EXPIRED") String status,
            @NotNull JsonNode data,
            @NotNull @PositiveOrZero Integer version) {
    }
}
