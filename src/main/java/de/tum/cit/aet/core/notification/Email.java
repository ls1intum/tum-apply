package de.tum.cit.aet.core.notification;

import de.tum.cit.aet.core.constants.Language;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import lombok.Singular;

@Getter
@Builder
public class Email {

    @NonNull
    @Singular("to")
    private Set<String> to;

    @Singular("cc")
    private Set<String> cc;

    @Singular("bcc")
    private Set<String> bcc;

    private String template;

    @Builder.Default
    private Map<String, Object> content = new HashMap<>();

    private String htmlBody;

    @Builder.Default
    private Language language = Language.ENGLISH;

    private Set<UUID> documentIds;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    /**
     * Validates the email addresses
     */
    public void validate() {
        Stream.of(to, cc, bcc)
            .filter(Objects::nonNull)
            .flatMap(Collection::stream)
            .forEach(address -> {
                if (!EMAIL_PATTERN.matcher(address).matches()) {
                    throw new IllegalArgumentException("Invalid email address: " + address);
                }
            });
    }
}
