package de.tum.cit.aet.core.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Collection;

@Getter
@Setter
@AllArgsConstructor
public class PageResponseDTO<T> {

    private Collection<T> content;

    private long totalElements;
}
