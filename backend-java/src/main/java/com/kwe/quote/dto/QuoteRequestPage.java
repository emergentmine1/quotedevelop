package com.kwe.quote.dto;

import java.util.List;

/** A page of the admin quote list plus the total match count for paging. */
public record QuoteRequestPage(List<QuoteRequestSummary> items, int total, int limit, int offset) {
}
