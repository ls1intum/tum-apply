package de.tum.cit.aet.usermanagement.constants;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OtpPurpose {
    LOGIN,
    REGISTER,
    APPLICATION_EMAIL_VERIFICATION;

    @JsonCreator
    public static OtpPurpose fromJson(String s) {
        if (s == null) throw new IllegalArgumentException("purpose is required");
        return OtpPurpose.valueOf(s.trim().toUpperCase());
    }
}
