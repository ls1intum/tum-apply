package de.tum.cit.aet.core.util;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import de.tum.cit.aet.core.exception.PDFGenerationException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

public class PDFBuilder {

    private static final String LOGO_PATH = "images/tum-logo-blue.png";

    private final String mainHeading;
    private final List<OverviewItem> overviewItems = new ArrayList<>();
    private String overviewTitle;
    private final List<SectionGroup> sectionGroups = new ArrayList<>();
    private SectionGroup currentGroup;

    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(0x18, 0x72, 0xDD);
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(0xC0, 0xC0, 0xC1);

    // ----------------- Borders -----------------
    private static final float BORDER_WIDTH = 0.8f;
    private static final BorderRadius BORDER_RADIUS = new BorderRadius(8f);
    private static final SolidBorder DEFAULT_BORDER = new SolidBorder(BORDER_COLOR, BORDER_WIDTH);

    // ----------------- Font Sizes -----------------
    private static final float FONT_SIZE_HEADER = 12f;
    private static final float FONT_SIZE_MAIN_HEADING = 20f;
    private static final float FONT_SIZE_GROUP_TITLE = 15f;
    private static final float FONT_SIZE_SECTION_TITLE = 12f;
    private static final float FONT_SIZE_TEXT = 10f;

    // ----------------- Spacing -----------------
    private static final float PADDING_CONTAINER = 8f;
    private static final float MARGIN_TITLE_BOTTOM = 8f;
    private static final float MARGIN_OVERVIEW_SECTION_BOTTOM = 20f;
    private static final float MARGIN_OVERVIEW_TITLE_BOTTOM = 12f;
    private static final float MARGIN_DATA_ROW_BOTTOM = 6f;
    private static final float DIVIDER_HEIGHT = 1f;
    private static final float HEADER_SPACING = 5f;
    private static final float HEADER_MARGIN_TOP = 20f;
    private static final float HEADER_MARGIN_BOTTOM = 16f;
    private static final float LINE_LEADING = 1.0f;

    public PDFBuilder(String mainHeading) {
        this.mainHeading = mainHeading;
    }

    // ----------------- Overview -----------------
    public PDFBuilder setOverviewTitle(String title) {
        this.overviewTitle = title;
        return this;
    }

    public PDFBuilder addOverviewItem(String label, String value) {
        overviewItems.add(new OverviewItem(label, value));
        return this;
    }

    // ----------------- Section Groups -----------------

    /**
     * Starts a new section group with the given title
     *
     * @param title the section group title
     * @return this builder for method chaining
     */
    public PDFBuilder startSectionGroup(String title) {
        currentGroup = new SectionGroup(title);
        sectionGroups.add(currentGroup);
        return this;
    }

    /**
     * Starts a new info section with the given title
     *
     * @param title the section title
     * @return this builder for method chaining
     */
    public PDFBuilder startInfoSection(String title) {
        InfoSection section = new InfoSection(title);
        if (currentGroup == null) {
            currentGroup = new SectionGroup(null);
            sectionGroups.add(currentGroup);
        }
        currentGroup.addSection(section);
        return this;
    }

    /**
     * Adds HTML content to the current section
     *
     * @param htmlContent the HTML content to add
     * @return this builder for method chaining
     */
    public PDFBuilder addSectionContent(String htmlContent) {
        if (currentGroup == null || currentGroup.sections.isEmpty()) {
            throw new IllegalStateException("Call startInfoSection first");
        }
        currentGroup.sections.get(currentGroup.sections.size() - 1).setHtmlContent(htmlContent);
        return this;
    }

    /**
     * Adds a data row (label-value pair) to the current section
     *
     * @param label the label text
     * @param value the value text
     * @return this builder for method chaining
     */
    public PDFBuilder addSectionData(String label, String value) {
        if (currentGroup == null || currentGroup.sections.isEmpty()) {
            throw new IllegalStateException("Call startInfoSection first");
        }
        currentGroup.sections.get(currentGroup.sections.size() - 1).addDataRow(label, value);
        return this;
    }

    // ----------------- Build PDF -----------------
    public Resource build() {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            PdfFont normalFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            addLogoHeader(document, boldFont);

            // Main Heading
            Paragraph mainHeadingParagraph = new Paragraph(mainHeading)
                .setFont(boldFont)
                .setFontColor(PRIMARY_COLOR)
                .setFontSize(FONT_SIZE_MAIN_HEADING)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(HEADER_MARGIN_TOP)
                .setMarginBottom(HEADER_MARGIN_BOTTOM);
            document.add(mainHeadingParagraph);

            // Overview Section
            if (!overviewItems.isEmpty()) {
                addOverviewSection(document, normalFont, boldFont);
            }

            // Section Groups
            for (SectionGroup group : sectionGroups) {
                if (group.title != null) {
                    Paragraph groupTitle = new Paragraph(group.title)
                        .setFont(boldFont)
                        .setFontSize(FONT_SIZE_GROUP_TITLE)
                        .setMarginBottom(MARGIN_TITLE_BOTTOM);
                    document.add(groupTitle);
                }
                for (InfoSection section : group.sections) {
                    addInfoSection(document, section, normalFont, boldFont);
                }
            }

            document.close();
            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            throw new PDFGenerationException("Failed to generate PDF", e);
        }
    }

    // ----------------- Helpers -----------------
    private void addLogoHeader(Document document, PdfFont boldFont) throws IOException {
        float logoSize = 35;
        Table headerTable = new Table(new float[] { 1, 4 });
        headerTable.setBorder(Border.NO_BORDER);
        headerTable.setHorizontalAlignment(HorizontalAlignment.LEFT);

        try {
            URL logoUrl = getClass().getClassLoader().getResource(LOGO_PATH);
            if (logoUrl != null) {
                Image logo = new Image(ImageDataFactory.create(logoUrl));
                logo.scaleToFit(logoSize, logoSize);
                Cell logoCell = new Cell()
                    .add(logo)
                    .setBorder(Border.NO_BORDER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .setPaddingRight(HEADER_SPACING);
                headerTable.addCell(logoCell);
            } else {
                headerTable.addCell(new Cell().setBorder(Border.NO_BORDER));
            }
        } catch (Exception e) {
            headerTable.addCell(new Cell().setBorder(Border.NO_BORDER));
        }

        Paragraph appNamePara = new Paragraph(new Text("Apply").setFont(boldFont).setFontSize(FONT_SIZE_HEADER))
            .setFontColor(PRIMARY_COLOR)
            .setMargin(0);

        Cell textCell = new Cell()
            .add(appNamePara)
            .setBorder(Border.NO_BORDER)
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setPaddingLeft(0);
        headerTable.addCell(textCell);

        document.add(headerTable);
    }

    private void addOverviewSection(Document document, PdfFont normalFont, PdfFont boldFont) {
        Div container = new Div()
            .setBorder(DEFAULT_BORDER)
            .setPadding(PADDING_CONTAINER)
            .setMarginBottom(MARGIN_OVERVIEW_SECTION_BOTTOM)
            .setBorderRadius(BORDER_RADIUS);

        if (overviewTitle != null) {
            Paragraph title = new Paragraph(overviewTitle)
                .setFont(boldFont)
                .setFontSize(FONT_SIZE_GROUP_TITLE)
                .setMarginBottom(MARGIN_OVERVIEW_TITLE_BOTTOM);
            container.add(title);
        }

        Paragraph inlineParagraph = new Paragraph();
        for (OverviewItem item : overviewItems) {
            inlineParagraph.add(new Text(item.label).setFont(boldFont).setFontSize(FONT_SIZE_TEXT));
            inlineParagraph.add(new Text(item.value).setFont(normalFont).setFontSize(FONT_SIZE_TEXT));
            inlineParagraph.add(new Text("    "));
        }

        container.add(inlineParagraph);
        document.add(container);
    }

    private void addInfoSection(Document document, InfoSection section, PdfFont normalFont, PdfFont boldFont) {
        Div container = new Div()
            .setBorder(DEFAULT_BORDER)
            .setPadding(PADDING_CONTAINER)
            .setMarginBottom(HEADER_MARGIN_BOTTOM)
            .setBorderRadius(BORDER_RADIUS);

        Paragraph title = new Paragraph(section.title)
            .setFont(boldFont)
            .setFontSize(FONT_SIZE_SECTION_TITLE)
            .setMarginBottom(MARGIN_TITLE_BOTTOM);
        container.add(title);

        Div divider = new Div().setHeight(DIVIDER_HEIGHT).setBackgroundColor(BORDER_COLOR).setMarginBottom(MARGIN_TITLE_BOTTOM);
        container.add(divider);

        if (section.htmlContent != null && !section.htmlContent.isEmpty()) {
            String plainText = section.htmlContent.replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").trim();
            Paragraph content = new Paragraph(plainText)
                .setFont(normalFont)
                .setFontSize(FONT_SIZE_TEXT)
                .setMargin(0)
                .setMarginBottom(MARGIN_DATA_ROW_BOTTOM)
                .setMultipliedLeading(LINE_LEADING);
            container.add(content);
        }

        for (DataRow row : section.dataRows) {
            Paragraph dataRow = new Paragraph()
                .add(new Text(row.label + ": ").setFont(boldFont))
                .add(new Text(row.value).setFont(normalFont))
                .setFontSize(FONT_SIZE_TEXT)
                .setMargin(0)
                .setMarginBottom(MARGIN_DATA_ROW_BOTTOM)
                .setMultipliedLeading(LINE_LEADING);
            container.add(dataRow);
        }

        document.add(container);
    }

    // ----------------- Inner Classes -----------------
    private static class OverviewItem {

        String label;
        String value;

        OverviewItem(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    private static class SectionGroup {

        String title;
        List<InfoSection> sections = new ArrayList<>();

        SectionGroup(String title) {
            this.title = title;
        }

        void addSection(InfoSection section) {
            sections.add(section);
        }
    }

    private static class InfoSection {

        String title;
        String htmlContent;
        List<DataRow> dataRows = new ArrayList<>();

        InfoSection(String title) {
            this.title = title;
        }

        void setHtmlContent(String content) {
            this.htmlContent = content;
        }

        void addDataRow(String label, String value) {
            this.dataRows.add(new DataRow(label, value));
        }
    }

    private static class DataRow {

        String label;
        String value;

        DataRow(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}
