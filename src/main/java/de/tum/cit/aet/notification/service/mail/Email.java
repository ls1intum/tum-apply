package de.tum.cit.aet.notification.service.mail;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
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

    /**
     * To load corresponding template
     */
    @NonNull
    private ResearchGroup researchGroup;

    @NonNull
    private EmailType emailType;

    @Builder.Default
    private String templateName = null;

    /**
     * Must be an instance of ResearchGroup, Job or Application
     * Must be present if no htmlBody is set
     */
    private Object content;

    /**
     * Raw HTML body of the email.
     * Use this field if you want to send a fully rendered HTML string without using a template.
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
