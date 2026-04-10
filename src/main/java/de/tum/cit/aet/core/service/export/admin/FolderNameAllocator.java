package de.tum.cit.aet.core.service.export.admin;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Per-export-folder name allocator. Either suffixes every name with the short
 * UUID (for the full admin export, which has to stay re-importable and stable
 * across runs) or leaves it as a clean human-readable slug while transparently
 * de-duplicating colliding slugs by appending a numeric suffix.
 *
 * <p>Each strategy creates a fresh allocator per logical scope (e.g. one for
 * the top-level jobs folder, a new one for the applications inside each job)
 * so collision detection is local and stable.
 */
final class FolderNameAllocator {

    private final boolean includeUuid;
    private final Map<String, Integer> seen = new HashMap<>();

    FolderNameAllocator(boolean includeUuid) {
        this.includeUuid = includeUuid;
    }

    /**
     * Returns a folder-name fragment for the given human label and entity id,
     * deduplicated within this allocator. Does not include any leading or
     * trailing slashes.
     */
    String allocate(String humanLabel, UUID id) {
        String base = AdminExportNaming.slug(humanLabel);
        if (includeUuid) {
            // UUID suffix already guarantees uniqueness; no dedupe needed.
            return base + "_" + AdminExportNaming.shortId(id);
        }
        int count = seen.merge(base, 1, Integer::sum);
        return count == 1 ? base : base + "_" + count;
    }
}
