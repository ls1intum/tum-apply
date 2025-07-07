package de.tum.cit.aet.core.notification;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.Document;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
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

    @NonNull
    private String subject;

    private String template;

    @Builder.Default
    private Map<String, Object> content = new HashMap<>();

    private String htmlBody;

    @Builder.Default
    private Language language = Language.ENGLISH;

    private Set<Document> documents;
}
