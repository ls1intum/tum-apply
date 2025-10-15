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
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
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

    // ----------------- Border & Padding -----------------
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(0xC0, 0xC0, 0xC1);
    private static final float BORDER_WIDTH = 0.8f;
    private static final float CONTAINER_PADDING = 12f;
    private static final BorderRadius BORDER_RADIUS = new BorderRadius(8f);
    private static final SolidBorder DEFAULT_BORDER = new SolidBorder(BORDER_COLOR, BORDER_WIDTH);

    // ----------------- Font Sizes -----------------
    private static final float FONT_SIZE_HEADER = 12f;
    private static final float FONT_SIZE_MAIN_HEADING = 20f;
    private static final float FONT_SIZE_GROUP_TITLE = 15f;
    private static final float FONT_SIZE_SECTION_TITLE = 12f;
    private static final float FONT_SIZE_LABEL = 10f; // Label in Overview/Section
    private static final float FONT_SIZE_VALUE = 10f; // Value in Overview/Section

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
    public PDFBuilder startSectionGroup(String title) {
        currentGroup = new SectionGroup(title);
        sectionGroups.add(currentGroup);
        return this;
    }

    public PDFBuilder startInfoSection(String title) {
        InfoSection section = new InfoSection(title);
        if (currentGroup == null) {
            currentGroup = new SectionGroup(null);
            sectionGroups.add(currentGroup);
        }
        currentGroup.addSection(section);
        return this;
    }

    public PDFBuilder addSectionContent(String htmlContent) {
        if (currentGroup == null || currentGroup.sections.isEmpty()) {
            throw new IllegalStateException("Call startInfoSection first");
        }
        currentGroup.sections.get(currentGroup.sections.size() - 1).setHtmlContent(htmlContent);
        return this;
    }

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
                .setMarginTop(20)
                .setMarginBottom(16);
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
                        .setMarginBottom(8);
                    document.add(groupTitle);
                }

                for (InfoSection section : group.sections) {
                    addInfoSection(document, section, normalFont, boldFont);
                }
            }

            document.close();
            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF", e);
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
                    .setPaddingRight(5);
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
            .setPadding(CONTAINER_PADDING)
            .setMarginBottom(20)
            .setBorderRadius(BORDER_RADIUS);

        if (overviewTitle != null) {
            Paragraph title = new Paragraph(overviewTitle).setFont(boldFont).setFontSize(FONT_SIZE_GROUP_TITLE).setMarginBottom(12);
            container.add(title);
        }

        Table table = new Table(UnitValue.createPercentArray(new float[] { 1, 1 })).useAllAvailableWidth().setBorder(null);

        for (int i = 0; i < overviewItems.size(); i += 2) {
            OverviewItem item1 = overviewItems.get(i);
            Cell cell1 = new Cell().setBorder(null).setPaddingBottom(8).setPaddingRight(16);
            Paragraph p1 = new Paragraph()
                .add(new Paragraph(item1.label + ": ").setFont(boldFont).setFontSize(FONT_SIZE_LABEL).setMarginBottom(2))
                .add(new Paragraph(item1.value).setFont(normalFont).setFontSize(FONT_SIZE_VALUE));
            cell1.add(p1);
            table.addCell(cell1);

            if (i + 1 < overviewItems.size()) {
                OverviewItem item2 = overviewItems.get(i + 1);
                Cell cell2 = new Cell().setBorder(null).setPaddingBottom(8);
                Paragraph p2 = new Paragraph()
                    .add(new Paragraph(item2.label + ": ").setFont(boldFont).setFontSize(FONT_SIZE_LABEL).setMarginBottom(2))
                    .add(new Paragraph(item2.value).setFont(normalFont).setFontSize(FONT_SIZE_VALUE));
                cell2.add(p2);
                table.addCell(cell2);
            } else {
                table.addCell(new Cell().setBorder(null));
            }
        }

        container.add(table);
        document.add(container);
    }

    private void addInfoSection(Document document, InfoSection section, PdfFont normalFont, PdfFont boldFont) {
        Div container = new Div()
            .setBorder(DEFAULT_BORDER)
            .setPadding(CONTAINER_PADDING)
            .setMarginBottom(20)
            .setBorderRadius(BORDER_RADIUS);

        Paragraph title = new Paragraph(section.title).setFont(boldFont).setFontSize(FONT_SIZE_SECTION_TITLE).setMarginBottom(8);
        container.add(title);

        Div divider = new Div().setHeight(1).setBackgroundColor(BORDER_COLOR).setMarginBottom(12);
        container.add(divider);

        if (section.htmlContent != null && !section.htmlContent.isEmpty()) {
            String plainText = section.htmlContent.replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").trim();
            Paragraph content = new Paragraph(plainText).setFont(normalFont).setFontSize(FONT_SIZE_VALUE);
            container.add(content);
        }

        for (DataRow row : section.dataRows) {
            Paragraph dataRow = new Paragraph()
                .add(new Paragraph(row.label + ": ").setFont(boldFont).setFontSize(FONT_SIZE_LABEL).setMarginBottom(2))
                .add(new Paragraph(row.value).setFont(normalFont).setFontSize(FONT_SIZE_VALUE))
                .setMarginBottom(8);
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
