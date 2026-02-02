package com.dearmi.backend.common.exception;

public class PrescriptionOcrException extends RuntimeException {

    public PrescriptionOcrException(String message) {
        super(message);
    }

    public PrescriptionOcrException(String message, Throwable cause) {
        super(message, cause);
    }
}
