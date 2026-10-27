package com.kwe.quote.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.jooq.DSLContext;
import org.jooq.JSONB;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kwe.quote.dto.RateProfileDtos.RateMatrixRow;
import com.kwe.quote.dto.RateProfileDtos.RateProfile;
import com.kwe.quote.dto.RateProfileDtos.SaveRateProfile;

import static com.kwe.quote.jooq.tables.KweRateMatrix.KWE_RATE_MATRIX;
import static com.kwe.quote.jooq.tables.KweRateProfile.KWE_RATE_PROFILE;

/** quoteownr.kwe_rate_profile + kwe_rate_matrix. All values bound as parameters by jOOQ. */
@Repository
public class RateProfileRepository {

    private final DSLContext dsl;
    private final ObjectMapper json;

    public RateProfileRepository(DSLContext dsl, ObjectMapper json) {
        this.dsl = dsl;
        this.json = json;
    }

    public List<RateProfile> list(String category) {
        var headers = dsl.selectFrom(KWE_RATE_PROFILE)
                .where(KWE_RATE_PROFILE.CATEGORY.eq(category))
                .orderBy(KWE_RATE_PROFILE.UPDATED_AT.desc(), KWE_RATE_PROFILE.PROFILE_ID.desc())
                .fetch();
        Map<Long, List<RateMatrixRow>> rows = rowsFor(headers.stream().map(h -> h.get(KWE_RATE_PROFILE.PROFILE_ID)).toList());
        return headers.stream().map(h -> toDto(h, rows.getOrDefault(h.get(KWE_RATE_PROFILE.PROFILE_ID), List.of()))).toList();
    }

    public Optional<RateProfile> find(long id) {
        return dsl.selectFrom(KWE_RATE_PROFILE).where(KWE_RATE_PROFILE.PROFILE_ID.eq(id)).fetchOptional()
                .map(h -> toDto(h, rowsFor(List.of(id)).getOrDefault(id, List.of())));
    }

    /** profile_code of an ACTIVE profile with the same key and overlapping dates, excluding {@code selfId}. */
    public Optional<String> findActiveOverlap(SaveRateProfile p, Long selfId) {
        return dsl.select(KWE_RATE_PROFILE.PROFILE_CODE).from(KWE_RATE_PROFILE)
                .where(KWE_RATE_PROFILE.STATUS.eq("ACTIVE"))
                .and(KWE_RATE_PROFILE.CHARGE_CODE.eq(p.chargeCode()))
                .and(KWE_RATE_PROFILE.CARRIER_CODE.eq(p.carrierCode()))
                .and(KWE_RATE_PROFILE.TRANSPORT_MODE.eq(p.transportMode()))
                .and(KWE_RATE_PROFILE.SERVICE_TYPE.eq(p.serviceType()))
                .and(KWE_RATE_PROFILE.ORIGIN_PORT.eq(p.originPort()))
                .and(KWE_RATE_PROFILE.EFFECTIVE_DATE.le(p.expirationDate()))
                .and(KWE_RATE_PROFILE.EXPIRATION_DATE.ge(p.effectiveDate()))
                .and(selfId == null ? DSL.noCondition() : KWE_RATE_PROFILE.PROFILE_ID.ne(selfId))
                .limit(1)
                .fetchOptional(KWE_RATE_PROFILE.PROFILE_CODE);
    }

    public long insert(SaveRateProfile p, String prefix, String user, LocalDateTime now) {
        long id = dsl.insertInto(KWE_RATE_PROFILE)
                .set(header(p, user, now))
                .set(KWE_RATE_PROFILE.VERSION, 1)
                .set(KWE_RATE_PROFILE.CREATED_BY, user)
                .set(KWE_RATE_PROFILE.CREATED_AT, now)
                .returningResult(KWE_RATE_PROFILE.PROFILE_ID)
                .fetchOne(KWE_RATE_PROFILE.PROFILE_ID);
        dsl.update(KWE_RATE_PROFILE).set(KWE_RATE_PROFILE.PROFILE_CODE, prefix + "-" + String.format("%05d", id))
                .where(KWE_RATE_PROFILE.PROFILE_ID.eq(id)).execute();
        insertRows(id, p.rows());
        return id;
    }

    /** Optimistic lock: false when the id is gone or the version is stale. */
    public boolean update(long id, int expectedVersion, SaveRateProfile p, String user, LocalDateTime now) {
        int n = dsl.update(KWE_RATE_PROFILE)
                .set(header(p, user, now))
                .set(KWE_RATE_PROFILE.VERSION, KWE_RATE_PROFILE.VERSION.plus(1))
                .where(KWE_RATE_PROFILE.PROFILE_ID.eq(id)).and(KWE_RATE_PROFILE.VERSION.eq(expectedVersion))
                .execute();
        if (n == 0) {
            return false;
        }
        dsl.deleteFrom(KWE_RATE_MATRIX).where(KWE_RATE_MATRIX.PROFILE_ID.eq(id)).execute();
        insertRows(id, p.rows());
        return true;
    }

    public boolean updateStatus(long id, int expectedVersion, String status, String user, LocalDateTime now) {
        return dsl.update(KWE_RATE_PROFILE)
                .set(KWE_RATE_PROFILE.STATUS, status)
                .set(KWE_RATE_PROFILE.VERSION, KWE_RATE_PROFILE.VERSION.plus(1))
                .set(KWE_RATE_PROFILE.UPDATED_BY, user)
                .set(KWE_RATE_PROFILE.UPDATED_AT, now)
                .where(KWE_RATE_PROFILE.PROFILE_ID.eq(id)).and(KWE_RATE_PROFILE.VERSION.eq(expectedVersion))
                .execute() == 1;
    }

    public boolean delete(long id) {
        return dsl.deleteFrom(KWE_RATE_PROFILE).where(KWE_RATE_PROFILE.PROFILE_ID.eq(id)).execute() == 1;
    }

    private Map<org.jooq.Field<?>, Object> header(SaveRateProfile p, String user, LocalDateTime now) {
        Map<org.jooq.Field<?>, Object> m = new java.util.LinkedHashMap<>();
        m.put(KWE_RATE_PROFILE.CATEGORY, p.category());
        m.put(KWE_RATE_PROFILE.CHARGE_CODE, p.chargeCode());
        m.put(KWE_RATE_PROFILE.CARRIER_CODE, p.carrierCode());
        m.put(KWE_RATE_PROFILE.TRANSPORT_MODE, p.transportMode());
        m.put(KWE_RATE_PROFILE.SERVICE_TYPE, p.serviceType());
        m.put(KWE_RATE_PROFILE.ORIGIN_PORT, p.originPort());
        m.put(KWE_RATE_PROFILE.CALCULATION_METHOD, p.calculationMethod());
        m.put(KWE_RATE_PROFILE.CURRENCY_CODE, p.currencyCode());
        m.put(KWE_RATE_PROFILE.EFFECTIVE_DATE, p.effectiveDate());
        m.put(KWE_RATE_PROFILE.EXPIRATION_DATE, p.expirationDate());
        m.put(KWE_RATE_PROFILE.EXTERNAL_MARKUP, p.externalMarkup());
        m.put(KWE_RATE_PROFILE.INTERNAL_MARKUP, p.internalMarkup());
        m.put(KWE_RATE_PROFILE.STATUS, p.status());
        m.put(KWE_RATE_PROFILE.REMARKS, p.remarks());
        m.put(KWE_RATE_PROFILE.WEIGHT_BREAKS, JSONB.valueOf(write(p.weightBreaks() == null ? List.of() : p.weightBreaks())));
        m.put(KWE_RATE_PROFILE.UPDATED_BY, user);
        m.put(KWE_RATE_PROFILE.UPDATED_AT, now);
        return m;
    }

    private void insertRows(long id, List<RateMatrixRow> rows) {
        for (int i = 0; i < rows.size(); i++) {
            RateMatrixRow r = rows.get(i);
            dsl.insertInto(KWE_RATE_MATRIX)
                    .set(KWE_RATE_MATRIX.PROFILE_ID, id)
                    .set(KWE_RATE_MATRIX.LINE_NO, i + 1)
                    .set(KWE_RATE_MATRIX.DEST_PORT, r.destPort())
                    .set(KWE_RATE_MATRIX.FLAT_AMOUNT, r.flatAmount())
                    .set(KWE_RATE_MATRIX.MIN_AMOUNT, r.minAmount())
                    .set(KWE_RATE_MATRIX.MAX_AMOUNT, r.maxAmount())
                    .set(KWE_RATE_MATRIX.RATES, JSONB.valueOf(write(r.rates() == null ? List.of() : r.rates())))
                    .execute();
        }
    }

    private Map<Long, List<RateMatrixRow>> rowsFor(List<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return dsl.selectFrom(KWE_RATE_MATRIX).where(KWE_RATE_MATRIX.PROFILE_ID.in(ids))
                .orderBy(KWE_RATE_MATRIX.PROFILE_ID, KWE_RATE_MATRIX.LINE_NO)
                .fetch().stream()
                .collect(Collectors.groupingBy(r -> r.get(KWE_RATE_MATRIX.PROFILE_ID), Collectors.mapping(r ->
                        new RateMatrixRow(r.get(KWE_RATE_MATRIX.DEST_PORT), r.get(KWE_RATE_MATRIX.FLAT_AMOUNT),
                                r.get(KWE_RATE_MATRIX.MIN_AMOUNT), r.get(KWE_RATE_MATRIX.MAX_AMOUNT),
                                read(r.get(KWE_RATE_MATRIX.RATES), new TypeReference<List<java.math.BigDecimal>>() { })),
                        Collectors.toList())));
    }

    private RateProfile toDto(Record h, List<RateMatrixRow> rows) {
        return new RateProfile(h.get(KWE_RATE_PROFILE.PROFILE_ID), h.get(KWE_RATE_PROFILE.PROFILE_CODE),
                h.get(KWE_RATE_PROFILE.CATEGORY), h.get(KWE_RATE_PROFILE.CHARGE_CODE), h.get(KWE_RATE_PROFILE.CARRIER_CODE),
                h.get(KWE_RATE_PROFILE.TRANSPORT_MODE), h.get(KWE_RATE_PROFILE.SERVICE_TYPE), h.get(KWE_RATE_PROFILE.ORIGIN_PORT),
                h.get(KWE_RATE_PROFILE.CALCULATION_METHOD), h.get(KWE_RATE_PROFILE.CURRENCY_CODE),
                h.get(KWE_RATE_PROFILE.EFFECTIVE_DATE), h.get(KWE_RATE_PROFILE.EXPIRATION_DATE),
                h.get(KWE_RATE_PROFILE.EXTERNAL_MARKUP), h.get(KWE_RATE_PROFILE.INTERNAL_MARKUP),
                h.get(KWE_RATE_PROFILE.STATUS), h.get(KWE_RATE_PROFILE.REMARKS),
                read(h.get(KWE_RATE_PROFILE.WEIGHT_BREAKS), new TypeReference<List<String>>() { }), rows,
                h.get(KWE_RATE_PROFILE.VERSION), h.get(KWE_RATE_PROFILE.CREATED_BY), h.get(KWE_RATE_PROFILE.CREATED_AT),
                h.get(KWE_RATE_PROFILE.UPDATED_BY), h.get(KWE_RATE_PROFILE.UPDATED_AT));
    }

    private String write(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("value is not serialisable", e);
        }
    }

    private <T> T read(JSONB value, TypeReference<T> type) {
        try {
            return json.readValue(value == null ? "[]" : value.data(), type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("stored JSON is invalid", e);
        }
    }
}
