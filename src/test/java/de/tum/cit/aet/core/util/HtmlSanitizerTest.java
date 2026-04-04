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
}
