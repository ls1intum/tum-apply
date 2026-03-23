package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(DocumentDictionary.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class DocumentDictionary_ {

    public static final String APPLICATION = "application";
    public static final String CUSTOM_FIELD_ANSWER = "customFieldAnswer";
    public static final String DOCUMENT_TYPE = "documentType";
    public static final String DOCUMENT = "document";
    public static final String DOCUMENT_DICTIONARY_ID = "documentDictionaryId";
    public static final String NAME = "name";
    public static final String APPLICANT = "applicant";

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#application
     **/
    public static volatile SingularAttribute<DocumentDictionary, Application> application;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#customFieldAnswer
     **/
    public static volatile SingularAttribute<DocumentDictionary, CustomFieldAnswer> customFieldAnswer;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#documentType
     **/
    public static volatile SingularAttribute<DocumentDictionary, DocumentType> documentType;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#document
     **/
    public static volatile SingularAttribute<DocumentDictionary, Document> document;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#documentDictionaryId
     **/
    public static volatile SingularAttribute<DocumentDictionary, UUID> documentDictionaryId;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#name
     **/
    public static volatile SingularAttribute<DocumentDictionary, String> name;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary
     **/
    public static volatile EntityType<DocumentDictionary> class_;

    /**
     * @see de.tum.cit.aet.core.domain.DocumentDictionary#applicant
     **/
    public static volatile SingularAttribute<DocumentDictionary, Applicant> applicant;
}
