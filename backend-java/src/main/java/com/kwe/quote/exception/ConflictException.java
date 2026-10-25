package com.kwe.quote.exception;

/** Optimistic-lock or unique-key clash. Becomes an HTTP 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
