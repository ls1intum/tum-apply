package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.GenderBiasWordLists;
import de.tum.cit.aet.core.util.StringUtil;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Analyzes text for gender-coded language (non-inclusive vs inclusive
 * stereotypes)
 */
@Component
public class GenderBiasAnalyzer {

    private final Map<String, WordLists> wordListsByLanguage;

    public GenderBiasAnalyzer() {
        wordListsByLanguage = new HashMap<>();
        wordListsByLanguage.put("de", new WordLists(GenderBiasWordLists.GERMAN_NON_INCLUSIVE, GenderBiasWordLists.GERMAN_INCLUSIVE));
        wordListsByLanguage.put("en", new WordLists(GenderBiasWordLists.ENGLISH_NON_INCLUSIVE, GenderBiasWordLists.ENGLISH_INCLUSIVE));
    }

    /**
     * Analyze text for gender bias in the specified language.
     *
     * @param text     the text to analyze
     * @param language the language code (e.g., "en" or "de")
     * @return an {@link AnalysisResult} containing counts of non-inclusive and
     *         inclusive words and coding type
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
        List<String> nonInclusiveWords = findCodedWords(dehyphenWordList, lists.nonInclusive);
        List<String> inclusiveWords = findCodedWords(dehyphenWordList, lists.Inclusive);

        // Assess coding
        int masculineCount = nonInclusiveWords.size();
        int feminineCount = inclusiveWords.size();
        String coding = assessCoding(masculineCount, feminineCount);

        return new AnalysisResult(text, nonInclusiveWords, inclusiveWords, masculineCount, feminineCount, coding, language);
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
                allCodedWords.addAll(wl.nonInclusive);
                allCodedWords.addAll(wl.Inclusive);
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
     * Find words that start with any of the coded word stems
     */
    private List<String> findCodedWords(List<String> wordList, Set<String> codedWords) {
        return wordList
            .stream()
            .filter(word -> codedWords.stream().anyMatch(word::startsWith))
            .collect(Collectors.toList());
    }

    /**
     * Assess overall coding of the text
     */
    private String assessCoding(int nonInclusiveCount, int inclusiveCount) {
        int codingScore = inclusiveCount - nonInclusiveCount;

        if (codingScore == 0) {
            if (inclusiveCount > 0) {
                return "neutral";
            } else {
                return "empty";
            }
        } else if (codingScore > 0) {
            return "inclusive-coded";
        } else {
            return "non-inclusive-coded";
        }
    }

    // ============= HELPER CLASSES =============

    private static class WordLists {

        final Set<String> nonInclusive;
        final Set<String> Inclusive;

        WordLists(Set<String> nonInclusive, Set<String> inclusive) {
            this.nonInclusive = nonInclusive;
            this.Inclusive = inclusive;
        }
    }

    /**
     * Analysis result container
     */
    public record AnalysisResult(
        String originalText,
        List<String> nonInclusiveWords,
        List<String> inclusiveWords,
        int nonInclusiveCount,
        int inclusiveCount,
        String coding,
        String language
    ) {}
}
