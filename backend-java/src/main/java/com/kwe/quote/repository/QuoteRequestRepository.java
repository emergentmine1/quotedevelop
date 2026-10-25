package com.kwe.quote.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import com.kwe.quote.dto.QuoteRequestLineItem;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.dto.QuoteRequestSummary;
import com.kwe.quote.jooq.tables.records.TxQuoteaccessorialservicesRecord;
import com.kwe.quote.jooq.tables.records.TxQuoterequestRecord;
import com.kwe.quote.jooq.tables.records.TxQuoterequestdetailsRecord;

import static com.kwe.quote.jooq.Sequences.TX_QUOTEREQUEST_SEQ;
import static com.kwe.quote.jooq.tables.TxQuoteaccessorialservices.TX_QUOTEACCESSORIALSERVICES;
import static com.kwe.quote.jooq.tables.TxQuoterequest.TX_QUOTEREQUEST;
import static com.kwe.quote.jooq.tables.TxQuoterequestdetails.TX_QUOTEREQUESTDETAILS;

/** Writes a quote request and its children. One save is four statements, whatever the line count. */
@Repository
public class QuoteRequestRepository {

    // No authentication yet, so rows are stamped with the service itself. cby is varchar(10).
    private static final String CREATED_BY = "api";
    private static final String TZ_SHORT = "GMT";
    private static final String TZ_IANA = "Etc/GMT";

    private final DSLContext dsl;

    public QuoteRequestRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Taken before the insert because qrref is built from the qrid. */
    public long nextQuoteRequestId() {
        return dsl.nextval(TX_QUOTEREQUEST_SEQ);
    }

    public void insertHeader(long qrid, String qrref, String status, QuoteRequestPayload payload,
            LocalDateTime now) {

        TxQuoterequestRecord record = dsl.newRecord(TX_QUOTEREQUEST);
        record.setQrid(qrid);
        record.setQrref(qrref);
        record.setStatus(status);

        record.setMode(payload.mode());
        record.setCargotype(payload.cargoType());
        record.setRatingtype(payload.ratingType());

        record.setPkuptype(payload.pickupType());
        record.setPoloading(payload.originPortCode());
        record.setPkupaddress1(payload.pickupAddress1());
        record.setPkupaddress2(payload.pickupAddress2());
        record.setPkupcity(payload.pickupCity());
        record.setPkupstate(payload.pickupState());
        record.setPkuppostalcode(payload.pickupPostalCode());
        record.setPkupcountrycode(payload.pickupCountryCode());

        record.setDelitype(payload.deliveryType());
        record.setPounloading(payload.destinationPortCode());
        record.setDeliaddress1(payload.deliveryAddress1());
        record.setDeliaddress2(payload.deliveryAddress2());
        record.setDelicity(payload.deliveryCity());
        record.setDelistate(payload.deliveryState());
        record.setDelipostalcode(payload.deliveryPostalCode());
        record.setDelicountrycode(payload.deliveryCountryCode());

        record.setWeightuom(payload.weightUom());
        record.setDimensionuom(payload.dimensionUom());
        record.setTotalgrossweight(payload.totalGrossWeight());
        record.setTotalgrossweightuom(payload.totalGrossWeightUom());
        record.setTotalvolume(payload.totalVolume());
        record.setTotalvolumeuom(payload.totalVolumeUom());
        record.setTotalvolumeweight(payload.totalVolumeWeight());
        record.setTotalvolumeweightuom(payload.totalVolumeWeightUom());
        record.setTotalchargeableweight(payload.totalChargeableWeight());
        record.setTotalchargeableweightuom(payload.totalChargeableWeightUom());

        record.setCargoreadydate(payload.cargoReadyDate());
        record.setCargoreadytz(payload.cargoReadyTz());
        record.setCargoreadytzstd(payload.cargoReadyTzStd());
        record.setReqdelidate(payload.requiredDeliveryDate());
        record.setReqdelitz(payload.requiredDeliveryTz());
        record.setReqdelitzstd(payload.requiredDeliveryTzStd());

        record.setFullname(payload.fullName());
        record.setCompanyname(payload.companyName());
        record.setIscommercialcust(payload.isCommercialCustomer());
        record.setEmail(payload.email());
        record.setIsconsentemail(payload.isConsentEmail());
        record.setPhone(payload.phone());
        record.setJobtitle(payload.jobTitle());
        record.setAddress(payload.address());
        record.setCountrycode(payload.countryCode());

        record.setVersion(0);
        record.setCby(CREATED_BY);
        record.setCdate(now);
        record.setCtz(TZ_SHORT);
        record.setCtzstd(TZ_IANA);
        record.setMby(CREATED_BY);
        record.setMdate(now);
        record.setMtz(TZ_SHORT);
        record.setMtzstd(TZ_IANA);

        record.insert();
    }

    /** Line numbers come from the list order, starting at 1. */
    public void insertLineItems(long qrid, List<QuoteRequestLineItem> lineItems, LocalDateTime now) {
        if (lineItems.isEmpty()) {
            return;
        }

        List<TxQuoterequestdetailsRecord> records = new ArrayList<>();
        int lineNo = 1;
        for (QuoteRequestLineItem item : lineItems) {
            TxQuoterequestdetailsRecord record = dsl.newRecord(TX_QUOTEREQUESTDETAILS);
            record.setQrid(qrid);
            record.setLineno(lineNo);
            record.setCommodity(item.commodity());
            record.setQuantity(item.quantity());
            record.setPackagetype(item.packageType());

            record.setGrossweight(item.grossWeight());
            record.setGrossweightuom(item.grossWeightUom());
            record.setVolume(item.volume());
            record.setVolumeuom(item.volumeUom());
            record.setVolumeweight(item.volumeWeight());
            record.setVolumeweightuom(item.volumeWeightUom());
            record.setChargeableweight(item.chargeableWeight());
            record.setChargeableweightuom(item.chargeableWeightUom());

            record.setLength(item.length());
            record.setWidth(item.width());
            record.setHeight(item.height());
            record.setDimensionuom(item.dimensionUom());

            // Both columns are NOT NULL, so apply the defaults the table declares.
            record.setIsstackable(orDefault(item.isStackable(), true));
            record.setIshazmat(orDefault(item.isHazmat(), false));

            record.setVersion(0);
            record.setCby(CREATED_BY);
            record.setCdate(now);
            record.setCtz(TZ_SHORT);
            record.setCtzstd(TZ_IANA);
            record.setMby(CREATED_BY);
            record.setMdate(now);
            record.setMtz(TZ_SHORT);
            record.setMtzstd(TZ_IANA);

            records.add(record);
            lineNo = lineNo + 1;
        }

        dsl.batchInsert(records).execute();
    }

    /** Null and an empty list both mean no accessorial service was selected. */
    public void insertAccessorialServices(long qrid, List<String> serviceCodes, LocalDateTime now) {
        if (serviceCodes == null || serviceCodes.isEmpty()) {
            return;
        }

        List<TxQuoteaccessorialservicesRecord> records = new ArrayList<>();
        for (String serviceCode : serviceCodes) {
            TxQuoteaccessorialservicesRecord record = dsl.newRecord(TX_QUOTEACCESSORIALSERVICES);
            record.setQrid(qrid);
            record.setServicecode(serviceCode);

            record.setVersion(0);
            record.setCby(CREATED_BY);
            record.setCdate(now);
            record.setCtz(TZ_SHORT);
            record.setCtzstd(TZ_IANA);
            record.setMby(CREATED_BY);
            record.setMdate(now);
            record.setMtz(TZ_SHORT);
            record.setMtzstd(TZ_IANA);

            records.add(record);
        }

        dsl.batchInsert(records).execute();
    }

    /** Every argument is optional; null means no filter on that field. Dates match cdate. */
    public Condition filter(String query, String countryCode, String status, LocalDate from,
            LocalDate to) {
        Condition condition = DSL.noCondition();
        if (query != null) {
            String like = "%" + query + "%";
            condition = condition.and(TX_QUOTEREQUEST.QRREF.likeIgnoreCase(like)
                    .or(TX_QUOTEREQUEST.FULLNAME.likeIgnoreCase(like))
                    .or(TX_QUOTEREQUEST.COMPANYNAME.likeIgnoreCase(like))
                    .or(TX_QUOTEREQUEST.EMAIL.likeIgnoreCase(like))
                    .or(TX_QUOTEREQUEST.POLOADING.likeIgnoreCase(like))
                    .or(TX_QUOTEREQUEST.POUNLOADING.likeIgnoreCase(like)));
        }
        if (countryCode != null) {
            condition = condition.and(TX_QUOTEREQUEST.PKUPCOUNTRYCODE.eq(countryCode)
                    .or(TX_QUOTEREQUEST.DELICOUNTRYCODE.eq(countryCode)));
        }
        if (status != null) {
            condition = condition.and(TX_QUOTEREQUEST.STATUS.eq(status));
        }
        if (from != null) {
            condition = condition.and(TX_QUOTEREQUEST.CDATE.ge(from.atStartOfDay()));
        }
        if (to != null) {
            condition = condition.and(TX_QUOTEREQUEST.CDATE.lt(to.plusDays(1).atStartOfDay()));
        }
        return condition;
    }

    /** Admin list: newest first, filtered by free text, country, status and created date. */
    public List<QuoteRequestSummary> search(Condition filter, int limit, int offset) {
        return dsl.select(TX_QUOTEREQUEST.QRID, TX_QUOTEREQUEST.QRREF, TX_QUOTEREQUEST.STATUS,
                        TX_QUOTEREQUEST.MODE, TX_QUOTEREQUEST.FULLNAME, TX_QUOTEREQUEST.COMPANYNAME,
                        TX_QUOTEREQUEST.EMAIL, TX_QUOTEREQUEST.PHONE, TX_QUOTEREQUEST.POLOADING,
                        TX_QUOTEREQUEST.PKUPCOUNTRYCODE, TX_QUOTEREQUEST.POUNLOADING,
                        TX_QUOTEREQUEST.DELICOUNTRYCODE, TX_QUOTEREQUEST.TOTALGROSSWEIGHT,
                        TX_QUOTEREQUEST.TOTALVOLUME, TX_QUOTEREQUEST.TOTALCHARGEABLEWEIGHT,
                        TX_QUOTEREQUEST.CARGOREADYDATE, TX_QUOTEREQUEST.CDATE, TX_QUOTEREQUEST.MDATE)
                .from(TX_QUOTEREQUEST)
                .where(filter)
                .orderBy(TX_QUOTEREQUEST.CDATE.desc(), TX_QUOTEREQUEST.QRID.desc())
                .limit(limit)
                .offset(offset)
                .fetch(r -> new QuoteRequestSummary(r.value1(), r.value2(), r.value3(), r.value4(),
                        r.value5(), r.value6(), r.value7(), r.value8(), r.value9(), r.value10(),
                        r.value11(), r.value12(), r.value13(), r.value14(), r.value15(), r.value16(),
                        r.value17(), r.value18()));
    }

    public int count(Condition filter) {
        return dsl.fetchCount(TX_QUOTEREQUEST, filter);
    }

    /** Returns the number of rows changed: 0 means no such qrid. */
    public int updateStatus(long qrid, String status, LocalDateTime now) {
        return dsl.update(TX_QUOTEREQUEST)
                .set(TX_QUOTEREQUEST.STATUS, status)
                .set(TX_QUOTEREQUEST.VERSION, TX_QUOTEREQUEST.VERSION.plus(1))
                .set(TX_QUOTEREQUEST.MBY, CREATED_BY)
                .set(TX_QUOTEREQUEST.MDATE, now)
                .set(TX_QUOTEREQUEST.MTZ, TZ_SHORT)
                .set(TX_QUOTEREQUEST.MTZSTD, TZ_IANA)
                .where(TX_QUOTEREQUEST.QRID.eq(qrid))
                .execute();
    }

    public Optional<QuoteRequestSummary> findSummary(long qrid) {
        return search(TX_QUOTEREQUEST.QRID.eq(qrid), 1, 0).stream().findFirst();
    }

    private boolean orDefault(Boolean value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        return value;
    }
}
