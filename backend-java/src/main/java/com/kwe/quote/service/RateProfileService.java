package com.kwe.quote.service;

import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kwe.quote.dto.RateProfileDtos.RateMatrixRow;
import com.kwe.quote.dto.RateProfileDtos.RateProfile;
import com.kwe.quote.dto.RateProfileDtos.SaveRateProfile;
import com.kwe.quote.exception.ConflictException;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.exception.NotFoundException;
import com.kwe.quote.repository.RateProfileRepository;

/**
 * Rate Profile rules. The no-overlapping-Active rule is checked here for a clear message and also
 * enforced by the kwe_rate_profile_no_active_overlap exclusion constraint, which covers races.
 */
@Service
@PreAuthorize("hasRole('READ_WRITE')")
public class RateProfileService {

    static final Map<String, List<String>> CHARGE_CODES = Map.of(
            "freight", List.of("FRTRV", "FSCRV", "SECFEERV"),
            "origin", List.of("CUSTCLRV", "CARTAGERV", "PKPRV", "HANRV", "IORV", "CPRV"));
    private static final Map<String, String> PREFIX = Map.of("freight", "RP-FRT", "origin", "RP-ORG");
    private static final String EXCLUSION_VIOLATION = "23P01";

    private final RateProfileRepository repository;
    private final Clock clock;

    public RateProfileService(RateProfileRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<RateProfile> list(String category) {
        if (!CHARGE_CODES.containsKey(category)) {
            throw new InvalidRequestException("category must be freight or origin");
        }
        return repository.list(category);
    }

    @Transactional(readOnly = true)
    public RateProfile get(long id) {
        return repository.find(id).orElseThrow(() -> new NotFoundException("rate profile " + id + " does not exist"));
    }

    @Transactional
    public RateProfile create(SaveRateProfile body, String user) {
        validate(body);
        checkOverlap(body, null);
        long id = guarded(() -> repository.insert(body, PREFIX.get(body.category()), user, LocalDateTime.now(clock)));
        return get(id);
    }

    @Transactional
    public RateProfile update(long id, SaveRateProfile body, String user) {
        RateProfile current = get(id);
        if (body.version() == null) {
            throw new InvalidRequestException("version is required when updating");
        }
        if (!current.category().equals(body.category())) {
            throw new InvalidRequestException("category cannot be changed");
        }
        validate(body);
        checkOverlap(body, id);
        boolean ok = guarded(() -> repository.update(id, body.version(), body, user, LocalDateTime.now(clock)));
        if (!ok) {
            throw new ConflictException("Someone else saved this profile first. Reload and try again.");
        }
        return get(id);
    }

    @Transactional
    public RateProfile changeStatus(long id, String status, int version, String user) {
        RateProfile p = get(id);
        if ("ACTIVE".equals(status)) {
            checkOverlap(asSave(p, status), id);
        }
        boolean ok = guarded(() -> repository.updateStatus(id, version, status, user, LocalDateTime.now(clock)));
        if (!ok) {
            throw new ConflictException("Someone else saved this profile first. Reload and try again.");
        }
        return get(id);
    }

    /** Business rules that bean validation can't express. */
    void validate(SaveRateProfile p) {
        if (!CHARGE_CODES.get(p.category()).contains(p.chargeCode())) {
            throw new InvalidRequestException("chargeCode for " + p.category() + " must be one of " + CHARGE_CODES.get(p.category()));
        }
        if (p.expirationDate().isBefore(p.effectiveDate())) {
            throw new InvalidRequestException("expirationDate must be on or after effectiveDate");
        }
        boolean flat = !"WEIGHT".equals(p.calculationMethod());
        boolean weight = !"FLAT".equals(p.calculationMethod());
        List<String> breaks = p.weightBreaks() == null ? List.of() : p.weightBreaks();
        if (weight && breaks.isEmpty()) {
            throw new InvalidRequestException("at least one weight break is required for " + p.calculationMethod());
        }
        if (new HashSet<>(breaks).size() != breaks.size()) {
            throw new InvalidRequestException("weight breaks must be unique");
        }
        Set<String> seen = new HashSet<>();
        for (RateMatrixRow r : p.rows()) {
            if (!seen.add(r.destPort())) {
                throw new InvalidRequestException("destination " + r.destPort() + " is used in more than one row");
            }
            if (r.minAmount() != null && r.maxAmount() != null && r.minAmount().compareTo(r.maxAmount()) >= 0) {
                throw new InvalidRequestException("minAmount must be smaller than maxAmount for " + r.destPort());
            }
            if (flat && r.flatAmount() == null) {
                throw new InvalidRequestException("flatAmount is required for " + r.destPort());
            }
            int rates = r.rates() == null ? 0 : r.rates().size();
            if (weight && rates != breaks.size()) {
                throw new InvalidRequestException("each row needs one rate per weight break (" + r.destPort() + ")");
            }
        }
    }

    private void checkOverlap(SaveRateProfile p, Long selfId) {
        if (!"ACTIVE".equals(p.status())) {
            return;
        }
        repository.findActiveOverlap(p, selfId).ifPresent(code -> {
            throw new ConflictException(overlapMessage(code));
        });
    }

    static String overlapMessage(String code) {
        return "An Active profile (" + code + ") already exists for this Charge Code, Carrier, Transport Mode, "
                + "Service Type and Origin Port with overlapping dates. Change the dates, or set one of them to Draft/Inactive.";
    }

    private <T> T guarded(java.util.function.Supplier<T> action) {
        try {
            return action.get();
        } catch (DataAccessException e) {
            Throwable root = NestedExceptionUtils.getMostSpecificCause(e);
            if (root instanceof SQLException sql && EXCLUSION_VIOLATION.equals(sql.getSQLState())) {
                throw new ConflictException(overlapMessage("another profile"));
            }
            throw e;
        }
    }

    private static SaveRateProfile asSave(RateProfile p, String status) {
        return new SaveRateProfile(p.category(), p.chargeCode(), p.carrierCode(), p.transportMode(), p.serviceType(),
                p.originPort(), p.calculationMethod(), p.currencyCode(), p.effectiveDate(), p.expirationDate(),
                p.externalMarkup(), p.internalMarkup(), status, p.remarks(), p.weightBreaks(), p.rows(), p.version());
    }
}
