package de.tum.cit.aet.core.service.export.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.AdminExportType;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mutable, single-threaded audit trail for an admin export run. Tracks how
 * many entities of each category were expected (discovered in the database),
 * how many made it into the produced ZIP, and which ones failed and why.
 *
 * <p>The {@link Payload#status()} reported by {@link #finish()} is the
 * authoritative answer to "is this export complete?":
 * <ul>
 *   <li>{@link Status#COMPLETE} — for every category, {@code expected ==
 *       exported} and the failures list is empty. Safe to hand over.</li>
 *   <li>{@link Status#PARTIAL} — at least one entity is missing or failed.
 *       Inspect the {@code failures} list and re-run the export.</li>
 *   <li>{@link Status#ABORTED} — the response stream died mid-build (e.g.
 *       async timeout, client disconnect). The ZIP is incomplete by
 *       construction; never trust it.</li>
 * </ul>
 *
 * <p>An instance lives for the duration of one export request and is passed
 * down through the strategies as an explicit parameter. It is rendered to
 * {@code manifest.json} at the root of the produced ZIP so recipients (and
 * legal) can verify completeness without trusting the server-side log.
 */
public final class ExportManifest {

    private final AdminExportType type;
    private final UUID requestedBy;
    private final Instant startedAt;
    private Instant finishedAt;

    private final Counter researchGroups = new Counter();
    private final Counter jobs = new Counter();
    private final Counter applications = new Counter();
    private final Counter documents = new Counter();
    private final Counter users = new Counter();

    private final List<Failure> failures = new ArrayList<>();
    private boolean aborted = false;
    private String abortReason;

    public ExportManifest(AdminExportType type, UUID requestedBy) {
        this.type = type;
        this.requestedBy = requestedBy;
        this.startedAt = Instant.now();
    }

    /**
     * Adds {@code n} to the expected count for the given category.
     *
     * @param category the entity category to bump
     * @param n        how many additional entities are expected
     */
    public void expect(Category category, int n) {
        counterFor(category).expected += n;
    }

    /**
     * Records that one entity of the given category was successfully written.
     *
     * @param category the entity category that just succeeded
     */
    public void exported(Category category) {
        counterFor(category).exported++;
    }

    /**
     * Records that one entity failed to write. The failure is logged to the
     * manifest's failure list with the entity id and a short reason; the
     * counter is incremented and the manifest's status will be {@link Status#PARTIAL}.
     *
     * @param category the entity category that failed
     * @param id       the entity's primary key, for diagnostics
     * @param context  short human-readable label (e.g. job title, applicant name)
     * @param cause    the underlying exception
     */
    public void failed(Category category, UUID id, String context, Throwable cause) {
        counterFor(category).failed++;
        String reason = cause == null
            ? "unknown"
            : cause.getClass().getSimpleName() + (cause.getMessage() == null ? "" : ": " + cause.getMessage());
        failures.add(new Failure(category, id, context, reason));
    }

    /**
     * Marks the export as aborted (response stream broken).
     *
     * @param reason short message describing why the export aborted
     */
    public void aborted(String reason) {
        this.aborted = true;
        this.abortReason = reason;
    }

    /**
     * Stops the manifest's clock and returns a JSON-serializable snapshot
     * suitable for writing to {@code manifest.json}.
     *
     * @return a frozen snapshot of the manifest including totals and failures
     */
    public Payload finish() {
        if (this.finishedAt == null) {
            this.finishedAt = Instant.now();
        }
        return new Payload(
            type.name(),
            requestedBy,
            startedAt,
            finishedAt,
            Duration.between(startedAt, finishedAt).toMillis() / 1000.0,
            status(),
            new Totals(
                researchGroups.snapshot(),
                jobs.snapshot(),
                applications.snapshot(),
                documents.snapshot(),
                users.snapshot()
            ),
            aborted ? abortReason : null,
            List.copyOf(failures)
        );
    }

    private Status status() {
        if (aborted) {
            return Status.ABORTED;
        }
        boolean countsMatch =
            researchGroups.complete() && jobs.complete() && applications.complete() && documents.complete() && users.complete();
        return countsMatch && failures.isEmpty() ? Status.COMPLETE : Status.PARTIAL;
    }

    private Counter counterFor(Category c) {
        return switch (c) {
            case RESEARCH_GROUP -> researchGroups;
            case JOB -> jobs;
            case APPLICATION -> applications;
            case DOCUMENT -> documents;
            case USER -> users;
        };
    }

    public enum Category {
        RESEARCH_GROUP,
        JOB,
        APPLICATION,
        DOCUMENT,
        USER,
    }

    public enum Status {
        COMPLETE,
        PARTIAL,
        ABORTED,
    }

    private static final class Counter {

        int expected = 0;
        int exported = 0;
        int failed = 0;

        boolean complete() {
            return exported == expected && failed == 0;
        }

        Snapshot snapshot() {
            return new Snapshot(expected, exported, failed);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Snapshot(int expected, int exported, int failed) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Totals(
        Snapshot researchGroups,
        Snapshot jobs,
        Snapshot applications,
        Snapshot documents,
        Snapshot users
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Failure(Category category, UUID id, String context, String reason) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Payload(
        String exportType,
        UUID requestedBy,
        Instant startedAt,
        Instant finishedAt,
        double durationSeconds,
        Status status,
        Totals totals,
        String abortReason,
        List<Failure> failures
    ) {}
}
