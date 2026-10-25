package com.kwe.quote.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kwe.quote.dto.PricingMatrixDtos.CreatePricingMatrix;
import com.kwe.quote.dto.PricingMatrixDtos.PricingMatrix;
import com.kwe.quote.dto.PricingMatrixDtos.UpdatePricingMatrix;
import com.kwe.quote.exception.ConflictException;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.exception.NotFoundException;
import com.kwe.quote.repository.PricingMatrixRepository;

/** Pricing matrix CRUD. Method security repeats the URL rule so no future caller can skip it. */
@Service
@PreAuthorize("hasRole('READ_WRITE')")
public class PricingMatrixService {

    private static final List<String> TYPES = List.of("AIR", "LCL", "FCL", "SURCHARGE");

    private final PricingMatrixRepository repository;
    private final Clock clock;

    public PricingMatrixService(PricingMatrixRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<PricingMatrix> list(String matrixType) {
        String type = matrixType == null || matrixType.isBlank() ? null : matrixType.trim().toUpperCase(Locale.ROOT);
        if (type != null && !TYPES.contains(type)) {
            throw new InvalidRequestException("matrixType must be one of " + TYPES);
        }
        return repository.list(type);
    }

    @Transactional(readOnly = true)
    public PricingMatrix get(long matrixId) {
        return repository.find(matrixId).orElseThrow(() -> notFound(matrixId));
    }

    @Transactional
    public PricingMatrix create(CreatePricingMatrix body, String user) {
        if (repository.codeExists(body.matrixCode())) {
            throw new ConflictException("matrixCode " + body.matrixCode() + " already exists");
        }
        String status = body.status() == null ? "DRAFT" : body.status();
        long id = repository.insert(body.matrixType(), body.matrixCode(), body.name(), status, body.data(), user,
                LocalDateTime.now(clock));
        return get(id);
    }

    @Transactional
    public PricingMatrix update(long matrixId, UpdatePricingMatrix body, String user) {
        int updated = repository.update(matrixId, body.version(), body.name(), body.status(), body.data(), user,
                LocalDateTime.now(clock));
        if (updated == 0) {
            get(matrixId);
            throw new ConflictException("pricing matrix " + matrixId + " was changed by someone else; reload it");
        }
        return get(matrixId);
    }

    @Transactional
    public void delete(long matrixId) {
        if (repository.delete(matrixId) == 0) {
            throw notFound(matrixId);
        }
    }

    private NotFoundException notFound(long matrixId) {
        return new NotFoundException("pricing matrix " + matrixId + " does not exist");
    }
}
