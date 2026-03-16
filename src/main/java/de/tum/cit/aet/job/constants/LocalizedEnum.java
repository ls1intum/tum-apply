package de.tum.cit.aet.job.constants;

import java.util.Locale;

public interface LocalizedEnum {
    String getEnglishValue();

    String getGermanValue();

    /**
     * Resolves an enum constant from its enum name or one of its localized values.
     *
     * @param enumClass the enum type
     * @param value the raw value to resolve
     * @param <E> the localized enum type
     * @return the matching enum constant, or {@code null} when no match is found
     */
    static <E extends Enum<E> & LocalizedEnum> E fromValue(Class<E> enumClass, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalizedValue = normalizeLookupKey(value);
        for (E enumValue : enumClass.getEnumConstants()) {
            if (
                normalizeLookupKey(enumValue.name()).equals(normalizedValue) ||
                normalizeLookupKey(enumValue.getEnglishValue()).equals(normalizedValue) ||
                normalizeLookupKey(enumValue.getGermanValue()).equals(normalizedValue)
            ) {
                return enumValue;
            }
        }
        return null;
    }

    default String correctLanguageValue(String lang) {
        return "de".equalsIgnoreCase(lang) ? getGermanValue() : getEnglishValue();
    }

    private static String normalizeLookupKey(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
