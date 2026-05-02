package de.tum.cit.aet.job.constants;

import java.util.Locale;

public interface LocalizedEnum {
    String getEnglishValue();

    String getGermanValue();

    default String correctLanguageValue(String lang) {
        if (lang == null) {
            return getEnglishValue();
        }
        return lang.toLowerCase(Locale.ROOT).startsWith("de") ? getGermanValue() : getEnglishValue();
    }
}
