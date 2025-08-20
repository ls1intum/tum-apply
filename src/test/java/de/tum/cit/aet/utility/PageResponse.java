// src/test/java/de/tum/cit/aet/utility/PageResponse.java
package de.tum.cit.aet.utility;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/** Minimal wrapper to deserialize Spring Data Page JSON in tests. */
@JsonIgnoreProperties(ignoreUnknown = true) // ignore "pageable", "sort", etc.
public record PageResponse<T>(List<T> content, int number, int size, long totalElements) {}
