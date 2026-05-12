package de.tum.cit.aet.ai.domain;

import de.tum.cit.aet.ai.constants.GenderCategory;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class BiasedIssue {

    private String language;
    private String word;

    @Enumerated(EnumType.STRING)
    private GenderCategory type;
}
