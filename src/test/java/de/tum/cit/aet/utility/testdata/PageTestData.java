package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.dto.PageDTO;

/**
 * Test data helpers for PageDTO.
 * Keeps entity construction in one place.
 */
public final class PageTestData {

    private PageTestData() {}

    public static PageDTO createDefaultPageDTO(int pageNumber, int pageSize) {
        return new PageDTO(pageNumber, pageSize);
    }
}
