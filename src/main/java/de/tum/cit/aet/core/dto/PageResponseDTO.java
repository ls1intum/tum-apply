package de.tum.cit.aet.core.dto;

import java.util.Collection;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PageResponseDTO<T> {

    private Collection<T> content;

    private long totalElements;
}
