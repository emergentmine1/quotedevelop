package com.kwe.quote.controller;

import java.time.LocalDate;

import com.kwe.quote.dto.ApiErrorResponse;
import com.kwe.quote.dto.QuoteRequestPage;
import com.kwe.quote.dto.QuoteRequestStatusUpdate;
import com.kwe.quote.dto.QuoteRequestSummary;
import com.kwe.quote.service.QuoteRequestAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin list and status changes for quote requests. No authentication yet, like the rest of the API. */
@RestController
@RequestMapping("/api/v1/quote-requests")
@Tag(name = "QuoteRequests", description = "Submitting a quote request")
public class QuoteRequestAdminController {

    private final QuoteRequestAdminService service;

    public QuoteRequestAdminController(QuoteRequestAdminService service) {
        this.service = service;
    }

    @Operation(summary = "Search quote requests",
            description = "Newest first. query matches qrref, name, company, email and port codes. "
                    + "countryCode matches the pickup or delivery country. from and to are "
                    + "inclusive created dates.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matching quote requests."),
            @ApiResponse(responseCode = "400", description = "A parameter broke a rule.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public QuoteRequestPage search(
            @Parameter(example = "QR-2026") @RequestParam(required = false) String query,
            @Parameter(example = "US") @RequestParam(required = false) String countryCode,
            @Parameter(example = "RQSNEW") @RequestParam(required = false) String status,
            @Parameter(example = "2026-01-01") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(example = "2026-12-31") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Defaults to 50, maximum 500.") @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return service.search(query, countryCode, status, from, to, limit, offset);
    }

    @Operation(summary = "Change the status of a quote request",
            description = "status must be an active cdcode of category RQS.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated row."),
            @ApiResponse(responseCode = "400", description = "Unknown or inactive status code.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "No quote request with that qrid.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{qrid}/status")
    public QuoteRequestSummary updateStatus(@PathVariable long qrid,
            @Valid @RequestBody QuoteRequestStatusUpdate body) {
        return service.updateStatus(qrid, body.status());
    }
}
