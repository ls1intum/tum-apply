package de.tum.cit.aet.core.web;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Gender Bias Analyzer - Port from Python Gender Decoder
 * Analyzes text for gender-coded language (masculine vs feminine stereotypes)
 */
public class GenderBiasAnalyzer {

    private final Map<String, WordLists> wordListsByLanguage;

    public GenderBiasAnalyzer() {
        wordListsByLanguage = new HashMap<>();
        wordListsByLanguage.put("de", new WordLists(initializeGermanMasculineWords(), initializeGermanFeminineWords()));
        wordListsByLanguage.put("en", new WordLists(initializeEnglishMasculineWords(), initializeEnglishFeminineWords()));
    }

    /**
     * Analyze text for gender bias in specified language
     */
    public AnalysisResult analyze(String text, String language) {
        if (text == null || text.trim().isEmpty()) {
            return new AnalysisResult(text, Collections.emptyList(), Collections.emptyList(), 0, 0, "empty", language);
        }

        // Get word lists for language (fallback to English)
        WordLists lists = wordListsByLanguage.getOrDefault(language, wordListsByLanguage.get("en"));

        // Clean and tokenize
        List<String> wordList = cleanAndTokenize(text);

        // Find coded words
        List<String> masculineWords = findCodedWords(wordList, lists.masculine);
        List<String> feminineWords = findCodedWords(wordList, lists.feminine);

        // Assess coding
        int masculineCount = masculineWords.size();
        int feminineCount = feminineWords.size();
        String coding = assessCoding(masculineCount, feminineCount);

        return new AnalysisResult(text, masculineWords, feminineWords, masculineCount, feminineCount, coding, language);
    }

    /**
     * Clean text and split into words (port of clean_up_word_list)
     */
    private List<String> cleanAndTokenize(String text) {
        // Remove non-ASCII except German umlauts (ß, ä, ö, ü, Ä, Ö, Ü)
        String cleanedText = text
            .chars()
            .mapToObj(c -> {
                if (c < 128 || c == 223 || c == 228 || c == 246 || c == 252 || c == 196 || c == 214 || c == 220) {
                    return String.valueOf((char) c);
                }
                return " ";
            })
            .collect(Collectors.joining());

        // Normalize whitespace
        cleanedText = cleanedText.replaceAll("\\s+", " ");

        // Remove punctuation
        cleanedText = cleanedText.replaceAll("[.\\t,\"'<>*?!\\[\\]@:;()./&]", " ");

        // Split and lowercase
        List<String> words = Arrays.stream(cleanedText.split(" "))
            .map(String::toLowerCase)
            .filter(word -> !word.isEmpty())
            .collect(Collectors.toList());

        // De-hyphenate non-coded words
        return deHyphenNonCodedWords(words);
    }

    /**
     * Split hyphenated words unless they're in the coded words list
     */
    private List<String> deHyphenNonCodedWords(List<String> wordList) {
        List<String> result = new ArrayList<>();

        Set<String> allCodedWords = new HashSet<>();
        wordListsByLanguage
            .values()
            .forEach(wl -> {
                allCodedWords.addAll(wl.masculine);
                allCodedWords.addAll(wl.feminine);
            });

        for (String word : wordList) {
            if (word.contains("-") && allCodedWords.stream().noneMatch(word::contains)) {
                result.addAll(Arrays.asList(word.split("-")));
            } else {
                result.add(word);
            }
        }

        return result;
    }

    /**
     * Find words that match coded word patterns (stem matching)
     */
    private List<String> findCodedWords(List<String> wordList, Set<String> codedWords) {
        return wordList
            .stream()
            .filter(word -> codedWords.stream().anyMatch(word::contains))
            .collect(Collectors.toList());
    }

    /**
     * Assess overall coding of the text
     */
    private String assessCoding(int masculineCount, int feminineCount) {
        int codingScore = feminineCount - masculineCount;

        if (codingScore == 0) {
            if (feminineCount > 0) {
                return "neutral";
            } else {
                return "empty";
            }
        } else if (codingScore > 0) {
            return "feminine-coded";
        } else {
            return "masculine-coded";
        }
    }

    // GERMAN WORD LISTS (From gender decoder code itself)

    private Set<String> initializeGermanMasculineWords() {
        return new HashSet<>(
            Arrays.asList(
                "abenteuer",
                "aggressiv",
                "ambition",
                "analytisch",
                "aufgabenorientier",
                "autark",
                "autoritä",
                "autonom",
                "beharr",
                "besieg",
                "sieg",
                "bestimmt",
                "direkt",
                "domin",
                "durchsetz",
                "ehrgeiz",
                "eigenständig",
                "einzel",
                "einfluss",
                "einflussreich",
                "energisch",
                "entscheid",
                "entschlossen",
                "erfolgsorientier",
                "führ",
                "anführ",
                "gewinn",
                "hartnäckig",
                "herausfordern",
                "hierarch",
                "kompetitiv",
                "konkurr",
                "kräftig",
                "kraft",
                "leisten",
                "leistungsfähig",
                "leistungsorient",
                "leit",
                "anleit",
                "lenken",
                "mutig",
                "offensiv",
                "persisten",
                "rational",
                "risiko",
                "selbstbewusst",
                "selbstsicher",
                "selbstständig",
                "selbständig",
                "selbstvertrauen",
                "stark",
                "stärke",
                "stolz",
                "überlegen",
                "unabhängig",
                "wettbewerb",
                "wetteifer",
                "wettkampf",
                "wettstreit",
                "willens",
                "zielorient",
                "zielsicher",
                "zielstrebig"
            )
        );
    }

    private Set<String> initializeGermanFeminineWords() {
        return new HashSet<>(
            Arrays.asList(
                "angenehm",
                "aufrichtig",
                "beraten",
                "bescheiden",
                "betreu",
                "beziehung",
                "commit",
                "dankbar",
                "ehrlich",
                "einfühl",
                "emotion",
                "empath",
                "engag",
                "familie",
                "fleiß",
                "förder",
                "freundlich",
                "freundschaft",
                "fürsorg",
                "gefühl",
                "gemeinsam",
                "gemeinschaft",
                "gruppe",
                "harmon",
                "helfen",
                "herzlich",
                "hilf",
                "höflich",
                "interpers",
                "kollabor",
                "kollegial",
                "kooper",
                "kümmern",
                "liebensw",
                "loyal",
                "miteinander",
                "mitfühl",
                "mitgefühl",
                "mithelf",
                "mithilf",
                "nett",
                "partnerschaftlich",
                "pflege",
                "rücksicht",
                "sensib",
                "sozial",
                "team",
                "treu",
                "umgänglich",
                "umsichtig",
                "uneigennützig",
                "unterstütz",
                "verantwortung",
                "verbunden",
                "verein",
                "verlässlich",
                "verständnis",
                "vertrauen",
                "wertschätz",
                "zugehörig",
                "zusammen",
                "zuverlässig",
                "zwischenmensch"
            )
        );
    }

    // ENGLISH WORD LISTS (From https://gender-decoder.katmatfield.com/about)
    private Set<String> initializeEnglishMasculineWords() {
        return new HashSet<>(
            Arrays.asList(
                "active",
                "adventurous",
                "aggress",
                "ambitio",
                "analy",
                "assert",
                "athlet",
                "autonom",
                "battle",
                "boast",
                "challeng",
                "champion",
                "compet",
                "confident",
                "courag",
                "decid",
                "decision",
                "decisive",
                "defend",
                "determin",
                "domina",
                "dominant",
                "driven",
                "fearless",
                "fight",
                "force",
                "greedy",
                "head-strong",
                "headstrong",
                "hierarch",
                "hostil",
                "impulsive",
                "independen",
                "individual",
                "intellect",
                "lead",
                "logic",
                "objective",
                "opinion",
                "outspoken",
                "persist",
                "principle",
                "reckless",
                "self-confiden",
                "self-relian",
                "self-sufficien",
                "selfconfiden",
                "selfrelian",
                "selfsufficien",
                "stubborn",
                "superior",
                "unreasonab"
            )
        );
    }

    private Set<String> initializeEnglishFeminineWords() {
        return new HashSet<>(
            Arrays.asList(
                "agree",
                "affectionate",
                "child",
                "cheer",
                "collab",
                "commit",
                "communal",
                "compassion",
                "connect",
                "considerate",
                "cooperat",
                "co-operat",
                "depend",
                "emotiona",
                "empath",
                "feel",
                "flatterable",
                "gentle",
                "honest",
                "interpersonal",
                "interdependen",
                "interpersona",
                "inter-personal",
                "inter-dependen",
                "inter-persona",
                "kind",
                "kinship",
                "loyal",
                "modesty",
                "nag",
                "nurtur",
                "pleasant",
                "polite",
                "quiet",
                "respon",
                "sensitiv",
                "submissive",
                "support",
                "sympath",
                "tender",
                "together",
                "trust",
                "understand",
                "warm",
                "whin",
                "enthusias",
                "inclusive",
                "yield",
                "share",
                "sharin"
            )
        );
    }

    // ============= HELPER CLASSES =============

    private static class WordLists {

        final Set<String> masculine;
        final Set<String> feminine;

        WordLists(Set<String> masculine, Set<String> feminine) {
            this.masculine = masculine;
            this.feminine = feminine;
        }
    }

    /**
     * Analysis result container
     */
    public static class AnalysisResult {

        private final String originalText;
        private final List<String> masculineWords;
        private final List<String> feminineWords;
        private final int masculineCount;
        private final int feminineCount;
        private final String coding;
        private final String language;

        public AnalysisResult(
            String originalText,
            List<String> masculineWords,
            List<String> feminineWords,
            int masculineCount,
            int feminineCount,
            String coding,
            String language
        ) {
            this.originalText = originalText;
            this.masculineWords = masculineWords;
            this.feminineWords = feminineWords;
            this.masculineCount = masculineCount;
            this.feminineCount = feminineCount;
            this.coding = coding;
            this.language = language;
        }

        // Getters
        public String getOriginalText() {
            return originalText;
        }

        public List<String> getMasculineWords() {
            return masculineWords;
        }

        public List<String> getFeminineWords() {
            return feminineWords;
        }

        public int getMasculineCount() {
            return masculineCount;
        }

        public int getFeminineCount() {
            return feminineCount;
        }

        public String getCoding() {
            return coding;
        }

        public String getLanguage() {
            return language;
        }
    }
}
