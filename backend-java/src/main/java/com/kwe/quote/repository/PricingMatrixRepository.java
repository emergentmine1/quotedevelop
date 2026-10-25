package com.kwe.quote.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.JSONB;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kwe.quote.dto.PricingMatrixDtos.PricingMatrix;

import static com.kwe.quote.jooq.tables.KwePricingMatrix.KWE_PRICING_MATRIX;

/** CRUD for quoteownr.kwe_pricing_matrix. */
@Repository
public class PricingMatrixRepository {

    private final DSLContext dsl;
    private final ObjectMapper objectMapper;

    public PricingMatrixRepository(DSLContext dsl, ObjectMapper objectMapper) {
        this.dsl = dsl;
        this.objectMapper = objectMapper;
    }

    public List<PricingMatrix> list(String matrixType) {
        Condition filter = matrixType == null ? DSL.noCondition() : KWE_PRICING_MATRIX.MATRIX_TYPE.eq(matrixType);
        return dsl.selectFrom(KWE_PRICING_MATRIX)
                .where(filter)
                .orderBy(KWE_PRICING_MATRIX.UPDATED_AT.desc())
                .fetch(this::toDto);
    }

    public Optional<PricingMatrix> find(long matrixId) {
        return dsl.selectFrom(KWE_PRICING_MATRIX)
                .where(KWE_PRICING_MATRIX.MATRIX_ID.eq(matrixId))
                .fetchOptional(this::toDto);
    }

    public boolean codeExists(String matrixCode) {
        return dsl.fetchExists(KWE_PRICING_MATRIX, KWE_PRICING_MATRIX.MATRIX_CODE.eq(matrixCode));
    }

    public long insert(String type, String code, String name, String status, JsonNode data, String user,
            LocalDateTime now) {
        return dsl.insertInto(KWE_PRICING_MATRIX)
                .set(KWE_PRICING_MATRIX.MATRIX_TYPE, type)
                .set(KWE_PRICING_MATRIX.MATRIX_CODE, code)
                .set(KWE_PRICING_MATRIX.NAME, name)
                .set(KWE_PRICING_MATRIX.STATUS, status)
                .set(KWE_PRICING_MATRIX.DATA, JSONB.valueOf(write(data)))
                .set(KWE_PRICING_MATRIX.VERSION, 0)
                .set(KWE_PRICING_MATRIX.CREATED_BY, user)
                .set(KWE_PRICING_MATRIX.CREATED_AT, now)
                .set(KWE_PRICING_MATRIX.UPDATED_BY, user)
                .set(KWE_PRICING_MATRIX.UPDATED_AT, now)
                .returningResult(KWE_PRICING_MATRIX.MATRIX_ID)
                .fetchOne(KWE_PRICING_MATRIX.MATRIX_ID);
    }

    /** Optimistic lock: 0 rows means missing id or stale version. */
    public int update(long matrixId, int expectedVersion, String name, String status, JsonNode data,
            String user, LocalDateTime now) {
        return dsl.update(KWE_PRICING_MATRIX)
                .set(KWE_PRICING_MATRIX.NAME, name)
                .set(KWE_PRICING_MATRIX.STATUS, status)
                .set(KWE_PRICING_MATRIX.DATA, JSONB.valueOf(write(data)))
                .set(KWE_PRICING_MATRIX.VERSION, KWE_PRICING_MATRIX.VERSION.plus(1))
                .set(KWE_PRICING_MATRIX.UPDATED_BY, user)
                .set(KWE_PRICING_MATRIX.UPDATED_AT, now)
                .where(KWE_PRICING_MATRIX.MATRIX_ID.eq(matrixId))
                .and(KWE_PRICING_MATRIX.VERSION.eq(expectedVersion))
                .execute();
    }

    public int delete(long matrixId) {
        return dsl.deleteFrom(KWE_PRICING_MATRIX).where(KWE_PRICING_MATRIX.MATRIX_ID.eq(matrixId)).execute();
    }

    private PricingMatrix toDto(Record r) {
        JSONB data = r.get(KWE_PRICING_MATRIX.DATA);
        return new PricingMatrix(r.get(KWE_PRICING_MATRIX.MATRIX_ID), r.get(KWE_PRICING_MATRIX.MATRIX_TYPE),
                r.get(KWE_PRICING_MATRIX.MATRIX_CODE), r.get(KWE_PRICING_MATRIX.NAME),
                r.get(KWE_PRICING_MATRIX.STATUS), read(data == null ? "{}" : data.data()),
                r.get(KWE_PRICING_MATRIX.VERSION), r.get(KWE_PRICING_MATRIX.CREATED_BY),
                r.get(KWE_PRICING_MATRIX.CREATED_AT), r.get(KWE_PRICING_MATRIX.UPDATED_BY),
                r.get(KWE_PRICING_MATRIX.UPDATED_AT));
    }

    private String write(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("data is not valid JSON", e);
        }
    }

    private JsonNode read(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("stored pricing data is not valid JSON", e);
        }
    }
}
