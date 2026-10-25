package com.kwe.quote.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.jooq.Condition;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kwe.quote.dto.QuoteRequestPage;
import com.kwe.quote.dto.QuoteRequestSummary;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.exception.NotFoundException;
import com.kwe.quote.repository.CodeDetailRepository;
import com.kwe.quote.repository.QuoteRequestRepository;

/** Admin side of quote requests: search the list and move a request through its RQS status. */
@Service
public class QuoteRequestAdminService {

    private static final String STATUS_CATEGORY = "RQS";
    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 500;
    private static final int MAX_QUERY_LENGTH = 60;
    private static final Pattern COUNTRY_PATTERN = Pattern.compile("^[A-Z]{2}$");

    private final QuoteRequestRepository repository;
    private final CodeDetailRepository codeDetailRepository;
    private final Clock clock;

    public QuoteRequestAdminService(QuoteRequestRepository repository,
            CodeDetailRepository codeDetailRepository, Clock clock) {
        this.repository = repository;
        this.codeDetailRepository = codeDetailRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public QuoteRequestPage search(String query, String countryCode, String status, LocalDate from,
            LocalDate to, Integer limit, Integer offset) {

        String q = blankToNull(query);
        if (q != null && q.length() > MAX_QUERY_LENGTH) {
            throw new InvalidRequestException("query must be at most " + MAX_QUERY_LENGTH + " characters");
        }
        String country = blankToNull(countryCode);
        if (country != null) {
            country = country.toUpperCase(Locale.ROOT);
            if (!COUNTRY_PATTERN.matcher(country).matches()) {
                throw new InvalidRequestException("countryCode must be a 2 letter ISO code");
            }
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidRequestException("from must not be after to");
        }
        int pageLimit = limit == null ? DEFAULT_LIMIT : limit;
        int pageOffset = offset == null ? 0 : offset;
        if (pageLimit < 1 || pageLimit > MAX_LIMIT) {
            throw new InvalidRequestException("limit must be between 1 and " + MAX_LIMIT);
        }
        if (pageOffset < 0) {
            throw new InvalidRequestException("offset must not be negative");
        }

        String statusCode = blankToNull(status);
        Condition filter = repository.filter(q, country,
                statusCode == null ? null : statusCode.toUpperCase(Locale.ROOT), from, to);
        List<QuoteRequestSummary> items = repository.search(filter, pageLimit, pageOffset);
        return new QuoteRequestPage(items, repository.count(filter), pageLimit, pageOffset);
    }

    @Transactional
    public QuoteRequestSummary updateStatus(long qrid, String status) {
        String code = status.trim().toUpperCase(Locale.ROOT);
        Map<String, String> categoryByCode = codeDetailRepository.findCategoryByCode(List.of(code));
        if (!STATUS_CATEGORY.equals(categoryByCode.get(code))) {
            throw new InvalidRequestException("status must be an active " + STATUS_CATEGORY
                    + " code, got: " + code);
        }
        int updated = repository.updateStatus(qrid, code, LocalDateTime.now(clock));
        if (updated == 0) {
            throw new NotFoundException("quote request " + qrid + " does not exist");
        }
        return repository.findSummary(qrid).orElseThrow();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
