package de.tum.cit.aet.core.notification;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.usermanagement.domain.User;
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
    private Set<User> to;

    @Singular("cc")
    private Set<User> cc;

    @Singular("bcc")
    private Set<User> bcc;

    @NonNull
    private EmailType emailType;

    /**
     * Name of the email template file (without .ftl suffix).
     *
     * Templates must be stored in 'src/main/resources/en/' and 'src/main/resources/de/' folders
     * depending on the selected language. This field is required if you want to use a predefined template.
     *
     * Use this field together with 'content' to render a dynamic HTML email.
     * Leave this null if you're using 'htmlBody' directly.
     */
    private String template;

    /**
     * Dynamic content for the email template.
     *
     * This map provides key-value pairs that will replace placeholders within the Freemarker template.
     * Only used when 'template' is defined.
     *
     * Leave this empty or null if you're not using a template.
     */
    @Builder.Default
    private Map<String, Object> content = new HashMap<>();

    /**
     * Raw HTML body of the email.
     *
     * Use this field if you want to send a fully rendered HTML string without using a template or content variables.
     *
     * If this is set, it will be used as-is and the 'template' and 'content' fields will be ignored.
     */
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
            .forEach(user -> {
                if (!EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
                    throw new IllegalArgumentException("Invalid email address: " + user.getEmail());
                }
            });
    }
}
