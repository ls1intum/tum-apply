package de.tum.cit.aet.core.util;

import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

public class OffsetPageRequest implements Pageable {

    private final int offset;
    private final int limit;
    private final Sort sort;

    public OffsetPageRequest(int offset, int limit, Sort sort) {
        if (offset < 0) {
            throw new IllegalArgumentException("Offset must not be negative");
        }
        if (limit < 1) {
            throw new IllegalArgumentException("Limit must be at least one");
        }
        this.offset = offset;
        this.limit = limit;
        this.sort = sort == null ? Sort.unsorted() : sort;
    }

    @Override
    public boolean isPaged() {
        return true;
    }

    @Override
    public boolean isUnpaged() {
        return false;
    }

    @Override
    public int getPageNumber() {
        return offset / limit;
    }

    @Override
    public int getPageSize() {
        return limit;
    }

    @Override
    public long getOffset() {
        return offset;
    }

    @Override
    public @NonNull Sort getSort() {
        return sort;
    }

    @Override
    public @NonNull Sort getSortOr(@NonNull Sort fallback) {
        return sort.isSorted() ? sort : fallback;
    }

    @Override
    public @NonNull Pageable next() {
        return new OffsetPageRequest(offset + limit, limit, sort);
    }

    @Override
    public @NonNull Pageable previousOrFirst() {
        return hasPrevious() ? new OffsetPageRequest(offset - limit, limit, sort) : first();
    }

    @Override
    public @NonNull Pageable first() {
        return new OffsetPageRequest(0, limit, sort);
    }

    @Override
    public @NonNull Pageable withPage(int pageNumber) {
        if (pageNumber < 0) {
            throw new IllegalArgumentException("Page index must not be negative");
        }
        return new OffsetPageRequest(pageNumber * limit, limit, sort);
    }

    @Override
    public boolean hasPrevious() {
        return offset > 0;
    }

    @Override
    public @NonNull Optional<Pageable> toOptional() {
        return Optional.of(this);
    }

    @Override
    public @NonNull Limit toLimit() {
        return Limit.of(limit);
    }
}
