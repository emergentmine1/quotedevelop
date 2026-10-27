package com.kwe.quote.controller;

import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.dto.RateProfileDtos.RateProfile;
import com.kwe.quote.dto.RateProfileDtos.SaveRateProfile;
import com.kwe.quote.dto.RateProfileDtos.StatusChange;
import com.kwe.quote.service.RateProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Rate Management. READ_WRITE only. 409 = overlapping Active profile or stale version. */
@RestController
@RequestMapping("/api/v1/rate-profiles")
@Tag(name = "RateProfiles", description = "Rate Profiles (Freight / Origin) and their Rate Matrix")
public class RateProfileController {

    private final RateProfileService service;

    public RateProfileController(RateProfileService service) {
        this.service = service;
    }

    @Operation(summary = "List profiles of a category, newest modification first")
    @GetMapping
    public ListResponse<RateProfile> list(@RequestParam String category) {
        return new ListResponse<>(service.list(category));
    }

    @GetMapping("/{id}")
    public RateProfile get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RateProfile create(@Valid @RequestBody SaveRateProfile body, Authentication auth) {
        return service.create(body, auth.getName());
    }

    @PutMapping("/{id}")
    public RateProfile update(@PathVariable long id, @Valid @RequestBody SaveRateProfile body, Authentication auth) {
        return service.update(id, body, auth.getName());
    }

    @Operation(summary = "Delete a profile and its Rate Matrix")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }

    @Operation(summary = "Activate / deactivate / draft a profile")
    @PatchMapping("/{id}/status")
    public RateProfile status(@PathVariable long id, @Valid @RequestBody StatusChange body, Authentication auth) {
        return service.changeStatus(id, body.status(), body.version(), auth.getName());
    }
}
