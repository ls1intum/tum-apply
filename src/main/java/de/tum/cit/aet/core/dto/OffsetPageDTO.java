package de.tum.cit.aet.core.dto;

import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;

@Validated
public record OffsetPageDTO(@Min(0) int offset, @Min(1) int limit) {}
