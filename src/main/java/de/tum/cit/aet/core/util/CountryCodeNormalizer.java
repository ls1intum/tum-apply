package de.tum.cit.aet.core.util;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Normalizes free-form country / nationality strings produced by the LLM
 * to lowercase ISO 3166-1 alpha-2 codes.
 *
 * <p>Returns {@code null} when the input cannot be confidently matched.
 * The frontend then leaves the corresponding dropdown empty.
 */
public final class CountryCodeNormalizer {

    private static final Map<String, String> LOOKUP = buildLookup();

    private CountryCodeNormalizer() {}

    /**
     * Normalizes the given country string to a lowercase ISO 3166-1 alpha-2 code.
     *
     * @param input free-form country name, ISO alpha-2, or ISO alpha-3
     * @return lowercase alpha-2 code, or {@code null} if no match
     */
    public static String normalize(String input) {
        if (input == null) {
            return null;
        }
        String key = input.trim().toLowerCase(Locale.ROOT);
        if (key.isEmpty()) {
            return null;
        }
        return LOOKUP.get(key);
    }

    private static Map<String, String> buildLookup() {
        Map<String, String> map = new HashMap<>();
        for (String alpha2 : Locale.getISOCountries()) {
            String code = alpha2.toLowerCase(Locale.ROOT);
            Locale locale = new Locale.Builder().setRegion(alpha2).build();
            map.put(code, code);
            putIfPresent(map, locale.getISO3Country().toLowerCase(Locale.ROOT), code);
            putIfPresent(map, locale.getDisplayCountry(Locale.ENGLISH).toLowerCase(Locale.ROOT), code);
            putIfPresent(map, locale.getDisplayCountry(Locale.GERMAN).toLowerCase(Locale.ROOT), code);
        }
        // Common aliases not covered by JDK display names
        map.put("uk", "gb");
        map.put("great britain", "gb");
        map.put("united states of america", "us");
        map.put("america", "us");
        return map;
    }

    private static void putIfPresent(Map<String, String> map, String key, String value) {
        if (key == null || key.isEmpty()) {
            return;
        }
        map.putIfAbsent(key, value);
    }
}
