package de.tum.cit.aet.job.constants;

public interface LocalizedEnum {
    String getEnglishValue();

    String getGermanValue();

    default String correctLanguageValue(String lang) {
        return "de".equalsIgnoreCase(lang) ? getGermanValue() : getEnglishValue();
    }
}
