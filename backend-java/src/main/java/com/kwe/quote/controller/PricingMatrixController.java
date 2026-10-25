package com.kwe.quote.controller;

import java.util.List;

import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.dto.PricingMatrixDtos.CreatePricingMatrix;
import com.kwe.quote.dto.PricingMatrixDtos.PricingMatrix;
import com.kwe.quote.dto.PricingMatrixDtos.UpdatePricingMatrix;
import com.kwe.quote.service.PricingMatrixService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Pricing matrices. READ_WRITE only (URL rule + method security). The audit user is the token's email. */
@RestController
@RequestMapping("/api/v1/pricing-matrices")
@Tag(name = "PricingMatrices", description = "Admin pricing matrices (READ_WRITE role)")
public class PricingMatrixController {

    private final PricingMatrixService service;

    public PricingMatrixController(PricingMatrixService service) {
        this.service = service;
    }

    @Operation(summary = "List pricing matrices, optionally by type (AIR, LCL, FCL, SURCHARGE)")
    @GetMapping
    public ListResponse<PricingMatrix> list(@RequestParam(required = false) String matrixType) {
        List<PricingMatrix> items = service.list(matrixType);
        return new ListResponse<>(items);
    }

    @GetMapping("/{matrixId}")
    public PricingMatrix get(@PathVariable long matrixId) {
        return service.get(matrixId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PricingMatrix create(@Valid @RequestBody CreatePricingMatrix body, Authentication auth) {
        return service.create(body, auth.getName());
    }

    @Operation(summary = "Update a pricing matrix", description = "Send the version you loaded; 409 if it changed.")
    @PutMapping("/{matrixId}")
    public PricingMatrix update(@PathVariable long matrixId, @Valid @RequestBody UpdatePricingMatrix body,
            Authentication auth) {
        return service.update(matrixId, body, auth.getName());
    }

    @DeleteMapping("/{matrixId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long matrixId) {
        service.delete(matrixId);
    }
}
