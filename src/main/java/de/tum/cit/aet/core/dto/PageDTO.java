package de.tum.cit.aet.core.dto;

import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;

@Validated
public record PageDTO(@Min(1) int pageSize, @Min(0) int pageNumber) {}
