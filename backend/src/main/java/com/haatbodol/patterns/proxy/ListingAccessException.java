package com.haatbodol.patterns.proxy;

import org.springframework.http.HttpStatus;

/**
 * Domain exception raised by the {@link ListingAccessService} Protection Proxy layer
 * carrying an explicit {@link HttpStatus} (e.g., 400, 401, 403, 404) for clean REST responses.
 */
public class ListingAccessException extends RuntimeException {

    private final HttpStatus status;

    public ListingAccessException(HttpStatus status, String message) {
        super(message);
        this.status = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public ListingAccessException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
