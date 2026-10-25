package com.kwe.quote.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One row of the admin quote list. {@code status} is an RQS cdcode. */
public record QuoteRequestSummary(
        long qrid,
        String qrref,
        String status,
        String mode,
        String fullName,
        String companyName,
        String email,
        String phone,
        String originPortCode,
        String pickupCountryCode,
        String destinationPortCode,
        String deliveryCountryCode,
        BigDecimal totalGrossWeight,
        BigDecimal totalVolume,
        BigDecimal totalChargeableWeight,
        LocalDateTime cargoReadyDate,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt) {
}
