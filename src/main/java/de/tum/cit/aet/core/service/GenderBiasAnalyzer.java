package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.GenderBiasWordLists;
import de.tum.cit.aet.core.util.StringUtil;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Analyzes text for gender-coded language (masculine vs feminine stereotypes)
 */
@Component
public class GenderBiasAnalyzer {

    private final Map<String, WordLists> wordListsByLanguage;

    public GenderBiasAnalyzer() {
        wordListsByLanguage = new HashMap<>();
        wordListsByLanguage.put("de", new WordLists(GenderBiasWordLists.GERMAN_MASCULINE, GenderBiasWordLists.GERMAN_FEMININE));
        wordListsByLanguage.put("en", new WordLists(GenderBiasWordLists.ENGLISH_MASCULINE, GenderBiasWordLists.ENGLISH_FEMININE));
    }

    /**
     * Analyze text for gender bias in the specified language.
     *
     * @param text     the text to analyze
     * @param language the language code (e.g., "en" or "de")
     * @return an {@link AnalysisResult} containing counts of masculine and feminine
     *         words and coding type
     */
    public AnalysisResult analyze(String text, String language) {
        if (text == null || text.trim().isEmpty()) {
            return new AnalysisResult(text, Collections.emptyList(), Collections.emptyList(), 0, 0, "empty", language);
        }

        // Get word lists for language (fallback to English)
        WordLists lists = wordListsByLanguage.getOrDefault(language, wordListsByLanguage.get("en"));

        // Clean and tokenize
        List<String> wordList = cleanAndTokenize(text);

        // Explicitly handle hyphenated words
        List<String> dehyphenWordList = deHyphenNonCodedWords(wordList);

        // Find coded words
        List<String> masculineWords = findCodedWords(dehyphenWordList, lists.masculine);
        List<String> feminineWords = findCodedWords(dehyphenWordList, lists.feminine);

        // Assess coding
        int masculineCount = masculineWords.size();
        int feminineCount = feminineWords.size();
        String coding = assessCoding(masculineCount, feminineCount);

        return new AnalysisResult(text, masculineWords, feminineWords, masculineCount, feminineCount, coding, language);
    }

    /**
     * Clean text and split into words
     */
    private List<String> cleanAndTokenize(String text) {
        String cleanedText = StringUtil.keepAsciiAndUmlauts(text);
        cleanedText = StringUtil.normalizeWhitespace(cleanedText);
        cleanedText = StringUtil.removePunctuation(cleanedText);

        List<String> words = Arrays.stream(cleanedText.split(" "))
            .map(String::toLowerCase)
            .filter(word -> !word.isEmpty())
            .collect(Collectors.toList());

        return words;
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
