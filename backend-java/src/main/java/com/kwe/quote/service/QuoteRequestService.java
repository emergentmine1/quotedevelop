package com.kwe.quote.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kwe.quote.dto.QuoteRequestCreated;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.repository.QuoteRequestRepository;

/** Validates a quote request, then stores it with its line items and accessorial services. */
@Service
public class QuoteRequestService {

    /** Every new request starts here. Sales move it on later. */
    private static final String STATUS_NEW = "RQSNEW";

    private final QuoteRequestValidator validator;
    private final QuoteRequestRepository repository;
    private final Clock clock;

    public QuoteRequestService(QuoteRequestValidator validator, QuoteRequestRepository repository,
            Clock clock) {
        this.validator = validator;
        this.repository = repository;
        this.clock = clock;
    }

    /** One transaction, so a failure part way through leaves no orphaned header behind. */
    @Transactional
    public QuoteRequestCreated create(QuoteRequestPayload payload) {
        validator.validate(payload);

        LocalDateTime now = LocalDateTime.now(clock);
        long qrid = repository.nextQuoteRequestId();
        String qrref = buildReference(qrid, now);

        repository.insertHeader(qrid, qrref, STATUS_NEW, payload, now);
        repository.insertLineItems(qrid, payload.lineItems(), now);
        repository.insertAccessorialServices(qrid, payload.accessorialServices(), now);

        return new QuoteRequestCreated(qrid, qrref, STATUS_NEW);
    }

    /** For example QR-2026-000045. Using the qrid makes it unique for free and traceable. */
    private String buildReference(long qrid, LocalDateTime now) {
        return String.format(Locale.ROOT, "QR-%d-%06d", now.getYear(), qrid);
    }
}
