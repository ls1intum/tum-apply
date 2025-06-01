package de.tum.cit.aet.core.service.support;

import de.tum.cit.aet.core.domain.DocumentDictionary;

@FunctionalInterface
public interface DocumentDictionaryOwnerSetter {
    void accept(DocumentDictionary dictionary);
}
