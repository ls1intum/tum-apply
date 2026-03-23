package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(Document.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Document_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String PATH = "path";
    public static final String DOCUMENT_ID = "documentId";
    public static final String MIME_TYPE = "mimeType";
    public static final String SHA256_ID = "sha256Id";
    public static final String UPLOADED_BY = "uploadedBy";
    public static final String SIZE_BYTES = "sizeBytes";

    /**
     * @see de.tum.cit.aet.core.domain.Document#path
     **/
    public static volatile SingularAttribute<Document, String> path;

    /**
     * @see de.tum.cit.aet.core.domain.Document#documentId
     **/
    public static volatile SingularAttribute<Document, UUID> documentId;

    /**
     * @see de.tum.cit.aet.core.domain.Document#mimeType
     **/
    public static volatile SingularAttribute<Document, String> mimeType;

    /**
     * @see de.tum.cit.aet.core.domain.Document#sha256Id
     **/
    public static volatile SingularAttribute<Document, String> sha256Id;

    /**
     * @see de.tum.cit.aet.core.domain.Document
     **/
    public static volatile EntityType<Document> class_;

    /**
     * @see de.tum.cit.aet.core.domain.Document#uploadedBy
     **/
    public static volatile SingularAttribute<Document, User> uploadedBy;

    /**
     * @see de.tum.cit.aet.core.domain.Document#sizeBytes
     **/
    public static volatile SingularAttribute<Document, Long> sizeBytes;
}
