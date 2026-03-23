package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(ResearchGroupImage.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class ResearchGroupImage_ extends de.tum.cit.aet.core.domain.Image_ {

    public static final String RESEARCH_GROUP = "researchGroup";

    /**
     * @see de.tum.cit.aet.core.domain.ResearchGroupImage#researchGroup
     **/
    public static volatile SingularAttribute<ResearchGroupImage, ResearchGroup> researchGroup;

    /**
     * @see de.tum.cit.aet.core.domain.ResearchGroupImage
     **/
    public static volatile EntityType<ResearchGroupImage> class_;
}
