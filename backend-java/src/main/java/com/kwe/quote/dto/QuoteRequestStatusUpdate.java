package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** New status for a quote request. Must be an active cdcode of category RQS. */
public record QuoteRequestStatusUpdate(
        @Schema(description = "RQS cdcode, for example RQSREV.", example = "RQSREV")
        @NotBlank @Size(max = 20) String status) {
}
