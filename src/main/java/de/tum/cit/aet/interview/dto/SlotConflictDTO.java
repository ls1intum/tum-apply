package de.tum.cit.aet.interview.dto;

import java.time.Instant;

/**
 * Minimal DTO containing only the information needed to display a time conflict error.
 * Used to avoid fetching full entities when checking for scheduling conflicts.
 */
public record SlotConflictDTO(Instant startDateTime, String jobTitle) {}
