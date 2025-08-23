package de.tum.cit.aet.notification.service.mail;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import lombok.Singular;

import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@Builder
public class Email {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

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
    private ResearchGroup researchGroup;

    @NonNull
    private EmailType emailType;

    @Builder.Default
    private String templateName = null;

    /**
     * Must be an instance of ResearchGroup, Job or Application
     * Must be present if no customBody is set
     */
    private Object content;

    /**
     * Custom subject of the email.
     * If this is set, it will be used as-is and the subject of the template will be ignored.
     */
    private String customSubject;

    /**
     * Custom HTML body of the email.
     * Use this field if you want to send a fully rendered HTML string without using a template.
     * If this is set, it will be used as-is and the 'template' and 'content' fields will be ignored.
     */
    private String customBody;

    /**
     * If the email settings should be checked, set to true.
     */
    @Builder.Default
    private boolean sendAlways = false;

    @Builder.Default
    private Language language = Language.ENGLISH;

    private Set<UUID> documentIds;

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

    /**
     * Concatenates all recipients as a String
     *
     * @return recipients of the email
     */
    public String getRecipients() {
        return this.getTo().stream().map(User::getEmail).collect(Collectors.joining(", "));
    }
}
