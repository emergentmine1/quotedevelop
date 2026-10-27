package com.kwe.quote.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Rate Profile header + Rate Matrix rows. Category is "freight" or "origin". */
public final class RateProfileDtos {

    private RateProfileDtos() {
    }

    public record RateMatrixRow(
            @NotBlank @Size(max = 10) String destPort,
            @DecimalMin("0") BigDecimal flatAmount,
            @DecimalMin("0") BigDecimal minAmount,
            @DecimalMin("0") BigDecimal maxAmount,
            List<@NotNull @DecimalMin("0") BigDecimal> rates) {
    }

    public record RateProfile(long id, String profileCode, String category, String chargeCode, String carrierCode,
            String transportMode, String serviceType, String originPort, String calculationMethod,
            String currencyCode, LocalDate effectiveDate, LocalDate expirationDate, BigDecimal externalMarkup,
            BigDecimal internalMarkup, String status, String remarks, List<String> weightBreaks,
            List<RateMatrixRow> rows, int version, String createdBy, LocalDateTime createdAt, String updatedBy,
            LocalDateTime updatedAt) {
    }

    /** Body for POST (create) and PUT (update; {@code version} required and must match). */
    public record SaveRateProfile(
            @NotBlank @Pattern(regexp = "freight|origin") String category,
            @NotBlank @Size(max = 20) String chargeCode,
            @NotBlank @Size(max = 20) String carrierCode,
            @NotBlank @Size(max = 10) String transportMode,
            @NotBlank @Size(max = 30) String serviceType,
            @NotBlank @Size(max = 10) String originPort,
            @NotBlank @Pattern(regexp = "FLAT|WEIGHT|FLAT_WEIGHT") String calculationMethod,
            @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currencyCode,
            @NotNull LocalDate effectiveDate,
            @NotNull LocalDate expirationDate,
            @DecimalMin("0") @DecimalMax("100") BigDecimal externalMarkup,
            @DecimalMin("0") @DecimalMax("100") BigDecimal internalMarkup,
            @NotBlank @Pattern(regexp = "DRAFT|ACTIVE|INACTIVE") String status,
            @Size(max = 500) String remarks,
            List<@NotBlank @Pattern(regexp = "^(<|>|<=|>=|=)?\\d+$") String> weightBreaks,
            @NotEmpty List<@Valid RateMatrixRow> rows,
            @PositiveOrZero Integer version) {
    }

    public record StatusChange(@NotBlank @Pattern(regexp = "DRAFT|ACTIVE|INACTIVE") String status,
            @NotNull @PositiveOrZero Integer version) {
    }
}
