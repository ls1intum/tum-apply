package de.tum.cit.aet.core.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Provides gender-neutral alternatives for biased words
 * Supports German and English
 */
public class GenderNeutralSuggestions {

    private final Map<String, Map<String, String>> masculineAlternativesByLanguage;
    private final Map<String, Map<String, String>> feminineAlternativesByLanguage;

    public GenderNeutralSuggestions() {
        this.masculineAlternativesByLanguage = new HashMap<>();
        this.feminineAlternativesByLanguage = new HashMap<>();

        // Initialize German alternatives
        masculineAlternativesByLanguage.put("de", initGermanMasculineAlternatives());
        feminineAlternativesByLanguage.put("de", initGermanFeminineAlternatives());

        // Initialize English alternatives
        masculineAlternativesByLanguage.put("en", initEnglishMasculineAlternatives());
        feminineAlternativesByLanguage.put("en", initEnglishFeminineAlternatives());
    }

    public String getNeutralAlternative(String word, String type, String language) {
        Map<String, String> alternatives;

        if ("masculine".equals(type)) {
            alternatives = masculineAlternativesByLanguage.getOrDefault(language, masculineAlternativesByLanguage.get("en"));
        } else {
            alternatives = feminineAlternativesByLanguage.getOrDefault(language, feminineAlternativesByLanguage.get("en"));
        }

        // Try exact match first
        String suggestion = alternatives.get(word.toLowerCase());
        if (suggestion != null) {
            return suggestion;
        }

        // Try stem matching
        for (Map.Entry<String, String> entry : alternatives.entrySet()) {
            if (word.toLowerCase().contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Fallback
        return "masculine".equals(type) ? "Try rephrasing with neutral language" : "Consider more direct language";
    }

    // ============= GERMAN ALTERNATIVES =============

    private Map<String, String> initGermanMasculineAlternatives() {
        Map<String, String> map = new HashMap<>();

        map.put("aggressiv", "durchsetzungsstark");
        map.put("dominant", "einflussreich");
        map.put("kompetitiv", "leistungsorientiert");
        map.put("entscheid", "entschlusskräftig");
        map.put("durchsetz", "zielstrebig");
        map.put("konkurr", "wettbewerbsorientiert");
        map.put("führ", "leiten");
        map.put("beharr", "beständig");
        map.put("eigenständig", "selbstorganisiert");
        map.put("überlegen", "kompetent");
        map.put("stolz", "selbstbewusst");
        map.put("hartnäckig", "ausdauernd");

        return map;
    }

    private Map<String, String> initGermanFeminineAlternatives() {
        Map<String, String> map = new HashMap<>();

        map.put("einfühl", "aufmerksam");
        map.put("emotion", "ausdrucksstark");
        map.put("sensib", "achtsam");
        map.put("fürsorg", "unterstützend");
        map.put("hilf", "unterstützend");
        map.put("höflich", "respektvoll");
        map.put("bescheiden", "zurückhaltend");
        map.put("angenehm", "freundlich");
        map.put("nett", "freundlich");
        map.put("liebensw", "sympathisch");
        map.put("unterstütz", "hilfreich");
        map.put("kümmern", "sich einsetzen");

        return map;
    }

    // ============= ENGLISH ALTERNATIVES =============

    private Map<String, String> initEnglishMasculineAlternatives() {
        Map<String, String> map = new HashMap<>();

        map.put("aggress", "assertive");
        map.put("dominant", "influential");
        map.put("compet", "driven");
        map.put("decis", "confident");
        map.put("fearless", "bold");
        map.put("headstrong", "determined");
        map.put("independen", "self-directed");
        map.put("individual", "person");
        map.put("lead", "guide");
        map.put("leader", "guide");
        map.put("objectiv", "fair");
        map.put("outspoken", "direct");
        map.put("stubborn", "persistent");
        map.put("superior", "skilled");
        map.put("boast", "confident");

        return map;
    }

    private Map<String, String> initEnglishFeminineAlternatives() {
        Map<String, String> map = new HashMap<>();

        map.put("affection", "friendly");
        map.put("compassion", "understanding");
        map.put("emotion", "expressive");
        map.put("gentle", "approachable");
        map.put("interpers", "collaborative");
        map.put("kind", "considerate");
        map.put("loyal", "reliable");
        map.put("nurtur", "develop");
        map.put("pleasant", "agreeable");
        map.put("polite", "respectful");
        map.put("quiet", "reserved");
        map.put("sensitiv", "aware");
        map.put("submissiv", "cooperative");
        map.put("support", "assist");
        map.put("trust", "reliability");
        map.put("understand", "comprehend");
        map.put("warm", "welcoming");

        return map;
    }
}
