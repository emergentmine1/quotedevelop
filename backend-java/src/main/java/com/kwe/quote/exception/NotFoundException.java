package com.kwe.quote.exception;

/** Thrown when a requested record does not exist. Becomes an HTTP 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
