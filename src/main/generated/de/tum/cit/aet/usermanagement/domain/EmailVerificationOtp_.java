package de.tum.cit.aet.usermanagement.domain;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.Instant;
import java.util.UUID;

@StaticMetamodel(EmailVerificationOtp.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class EmailVerificationOtp_ {

    public static final String CREATED_AT = "createdAt";
    public static final String MAX_ATTEMPTS = "maxAttempts";
    public static final String SALT = "salt";
    public static final String CODE_HASH = "codeHash";
    public static final String ID = "id";
    public static final String USED = "used";
    public static final String IP_HASH = "ipHash";
    public static final String EMAIL = "email";
    public static final String JTI = "jti";
    public static final String EXPIRES_AT = "expiresAt";
    public static final String ATTEMPTS = "attempts";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#createdAt
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, Instant> createdAt;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#maxAttempts
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, Integer> maxAttempts;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#salt
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, String> salt;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#codeHash
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, String> codeHash;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#id
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, UUID> id;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#used
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, Boolean> used;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#ipHash
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, String> ipHash;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp
     **/
    public static volatile EntityType<EmailVerificationOtp> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#email
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, String> email;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#jti
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, String> jti;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#expiresAt
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, Instant> expiresAt;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp#attempts
     **/
    public static volatile SingularAttribute<EmailVerificationOtp, Integer> attempts;
}
