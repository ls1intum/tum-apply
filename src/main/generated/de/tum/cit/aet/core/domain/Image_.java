package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(Image.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Image_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String IMAGE_ID = "imageId";
    public static final String MIME_TYPE = "mimeType";
    public static final String UPLOADED_BY = "uploadedBy";
    public static final String URL = "url";
    public static final String SIZE_BYTES = "sizeBytes";

    /**
     * @see de.tum.cit.aet.core.domain.Image#imageId
     **/
    public static volatile SingularAttribute<Image, UUID> imageId;

    /**
     * @see de.tum.cit.aet.core.domain.Image#mimeType
     **/
    public static volatile SingularAttribute<Image, String> mimeType;

    /**
     * @see de.tum.cit.aet.core.domain.Image
     **/
    public static volatile EntityType<Image> class_;

    /**
     * @see de.tum.cit.aet.core.domain.Image#uploadedBy
     **/
    public static volatile SingularAttribute<Image, User> uploadedBy;

    /**
     * @see de.tum.cit.aet.core.domain.Image#url
     **/
    public static volatile SingularAttribute<Image, String> url;

    /**
     * @see de.tum.cit.aet.core.domain.Image#sizeBytes
     **/
    public static volatile SingularAttribute<Image, Long> sizeBytes;
}
