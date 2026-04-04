package de.tum.cit.aet.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HtmlSanitizerTest {

    @Test
    void shouldStripScriptTags() {
        String result = HtmlSanitizer.sanitize("<p>Hello</p><script>alert('xss')</script>");
        assertThat(result).contains("Hello");
        assertThat(result).doesNotContain("<script");
        assertThat(result).doesNotContain("alert");
    }

    @Test
    void shouldStripImgOnerrorPayload() {
        String result = HtmlSanitizer.sanitize("<b>Bold</b><img src=x onerror=alert(1)>");
        assertThat(result).contains("Bold");
        assertThat(result).doesNotContain("onerror");
        assertThat(result).doesNotContain("<img");
    }

    @Test
    void shouldStripIframeTags() {
        String result = HtmlSanitizer.sanitize("<p>Text</p><iframe src='evil.com'></iframe>");
        assertThat(result).contains("Text");
        assertThat(result).doesNotContain("<iframe");
    }

    @Test
    void shouldStripSvgOnloadPayload() {
        String result = HtmlSanitizer.sanitize("<svg onload=alert(1)><circle/></svg>");
        assertThat(result).doesNotContain("<svg");
        assertThat(result).doesNotContain("onload");
    }

    @Test
    void shouldPreserveBasicFormattingTags() {
        String html = "<p>Paragraph</p><b>Bold</b><i>Italic</i><ul><li>Item</li></ul>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("<p>", "<b>", "<i>", "<ul>", "<li>");
    }

    @Test
    void shouldPreserveSafeAnchorTags() {
        String html = "<a href=\"https://example.com\" target=\"_blank\">Link</a>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("href=\"https://example.com\"");
        assertThat(result).contains("Link");
    }

    @Test
    void shouldStripJavascriptHref() {
        String html = "<a href=\"javascript:alert(1)\">Click</a>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).doesNotContain("javascript:");
    }

    @Test
    void shouldReturnNullForNullInput() {
        assertThat(HtmlSanitizer.sanitize(null)).isNull();
    }

    @Test
    void shouldReturnEmptyStringForBlankInput() {
        assertThat(HtmlSanitizer.sanitize("   ")).isEmpty();
        assertThat(HtmlSanitizer.sanitize("")).isEmpty();
    }

    @Test
    void shouldStripEventHandlerAttributes() {
        String result = HtmlSanitizer.sanitize("<div onclick=\"alert(1)\">Click me</div>");
        assertThat(result).doesNotContain("onclick");
        assertThat(result).contains("Click me");
    }

    @Test
    void shouldPreserveQuillAlignmentClasses() {
        String html =
            "<p class=\"ql-align-center\">Centered</p><p class=\"ql-align-right\">Right</p><p class=\"ql-align-justify\">Justified</p>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("ql-align-center");
        assertThat(result).contains("ql-align-right");
        assertThat(result).contains("ql-align-justify");
        assertThat(result).contains("Centered");
    }

    @Test
    void shouldPreserveQuillIndentClasses() {
        String html = "<li class=\"ql-indent-1\">Level 1</li><li class=\"ql-indent-3\">Level 3</li>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("ql-indent-1");
        assertThat(result).contains("ql-indent-3");
    }

    @Test
    void shouldStripNonQuillClasses() {
        String html = "<p class=\"malicious-class ql-align-center\">Text</p>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("ql-align-center");
        assertThat(result).doesNotContain("malicious-class");
        assertThat(result).contains("Text");
    }

    @Test
    void shouldStripClassAttributeEntirely_whenNoQuillClassPresent() {
        String html = "<p class=\"evil-injection\">Text</p>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).doesNotContain("class");
        assertThat(result).doesNotContain("evil-injection");
        assertThat(result).contains("Text");
    }

    @Test
    void shouldRejectInvalidQuillIndentValues() {
        // ql-indent-0 and ql-indent-9 are outside the allowed range 1-8
        String html = "<li class=\"ql-indent-0\">Zero</li><li class=\"ql-indent-9\">Nine</li>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).doesNotContain("ql-indent-0");
        assertThat(result).doesNotContain("ql-indent-9");
        assertThat(result).contains("Zero");
        assertThat(result).contains("Nine");
    }

    @Test
    void shouldPreserveMultipleQuillClassesOnSameElement() {
        // Quill doesn't normally produce this, but verify the filter handles it correctly
        String html = "<p class=\"ql-align-center ql-indent-2\">Text</p>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("ql-align-center");
        // Note: ql-indent on <p> is allowed by the safelist since class is permitted on p
        assertThat(result).contains("Text");
    }

    @Test
    void shouldNotAllowClassAttributeOnUnsupportedTags() {
        // class should only be allowed on <p> and <li>, not on other tags
        String html = "<b class=\"ql-align-center\">Bold</b><span class=\"ql-align-right\">Span</span>";
        String result = HtmlSanitizer.sanitize(html);
        assertThat(result).contains("Bold");
        // <b> and <span> don't have class in the safelist, so it should be stripped
        assertThat(result).doesNotContain("ql-align-center");
    }

    @Test
    void shouldPreserveComplexQuillDocument() {
        String html =
            "<p class=\"ql-align-center\"><b>Title</b></p>" +
            "<p>Normal paragraph</p>" +
            "<ul><li class=\"ql-indent-1\">Nested item</li></ul>" +
            "<p class=\"ql-align-right\"><a href=\"https://example.com\">Link</a></p>";
        String result = HtmlSanitizer.sanitize(html);

        assertThat(result).contains("ql-align-center");
        assertThat(result).contains("<b>Title</b>");
        assertThat(result).contains("Normal paragraph");
        assertThat(result).contains("ql-indent-1");
        assertThat(result).contains("Nested item");
        assertThat(result).contains("ql-align-right");
        assertThat(result).contains("href=\"https://example.com\"");
        assertThat(result).contains("Link");
        assertThat(result).doesNotContain("<script");
        assertThat(result).doesNotContain("<iframe");
    }

    @Test
    void shouldSanitizeWhilePreservingQuillClasses() {
        // Mix of legitimate Quill content with XSS payload
        String html =
            "<p class=\"ql-align-center\">Good content</p><script>alert('xss')</script>" +
            "<p class=\"malicious ql-align-right\">More content</p>";
        String result = HtmlSanitizer.sanitize(html);

        assertThat(result).contains("ql-align-center");
        assertThat(result).contains("Good content");
        assertThat(result).doesNotContain("<script");
        assertThat(result).doesNotContain("alert");
        assertThat(result).contains("ql-align-right");
        assertThat(result).doesNotContain("malicious");
        assertThat(result).contains("More content");
    }
}
