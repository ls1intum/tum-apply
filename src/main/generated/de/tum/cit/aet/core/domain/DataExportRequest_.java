package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDateTime;
import java.util.UUID;

@StaticMetamodel(DataExportRequest.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class DataExportRequest_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String READY_AT = "readyAt";
    public static final String FILE_PATH = "filePath";
    public static final String EXPORT_REQUEST_ID = "exportRequestId";
    public static final String DOWNLOAD_TOKEN = "downloadToken";
    public static final String LAST_REQUESTED_AT = "lastRequestedAt";
    public static final String USER = "user";
    public static final String EXPIRES_AT = "expiresAt";
    public static final String STATUS = "status";

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#readyAt
     **/
    public static volatile SingularAttribute<DataExportRequest, LocalDateTime> readyAt;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#filePath
     **/
    public static volatile SingularAttribute<DataExportRequest, String> filePath;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#exportRequestId
     **/
    public static volatile SingularAttribute<DataExportRequest, UUID> exportRequestId;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#downloadToken
     **/
    public static volatile SingularAttribute<DataExportRequest, String> downloadToken;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#lastRequestedAt
     **/
    public static volatile SingularAttribute<DataExportRequest, LocalDateTime> lastRequestedAt;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest
     **/
    public static volatile EntityType<DataExportRequest> class_;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#user
     **/
    public static volatile SingularAttribute<DataExportRequest, User> user;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#expiresAt
     **/
    public static volatile SingularAttribute<DataExportRequest, LocalDateTime> expiresAt;

    /**
     * @see de.tum.cit.aet.core.domain.DataExportRequest#status
     **/
    public static volatile SingularAttribute<DataExportRequest, DataExportState> status;
}
