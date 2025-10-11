package de.tum.cit.aet.core.util;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.IBlockElement;
import com.itextpdf.layout.element.IElement;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

public class PDFBuilder {

    private final String heading;
    private final List<Section> sections;
    private final List<Data> data;

    private record Data(String title, String value) {}

    private record Section(String heading, String htmlContent) {}

    public PDFBuilder(String heading) {
        this.heading = heading;
        this.sections = new ArrayList<>();
        this.data = new ArrayList<>();
    }

    public PDFBuilder addData(String title, String value) {
        data.add(new Data(title, value));
        return this;
    }

    public PDFBuilder addSection(String heading, String htmlContent) {
        sections.add(new Section(heading, htmlContent));
        return this;
    }

    public Resource build() {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Load bold font
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont normalFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Main heading
            Paragraph mainHeadingParagraph = new Paragraph(heading).setFont(boldFont).setFontSize(20).setMarginBottom(16);

            document.add(mainHeadingParagraph);

            // Converter properties
            ConverterProperties converterProperties = new ConverterProperties();

            // Add data rows
            for (Data row : data) {
                Paragraph element = new Paragraph().setFont(normalFont).setFontSize(10).setMarginBottom(2);

                if (row.title.isEmpty()) {
                    element.add(new Text(""));
                } else {
                    element.add(new Text(row.title + ": ").setFont(boldFont)).add(new Text(row.value).setFont(normalFont));
                }

                document.add(element);
            }

            // Add sections
            for (Section row : sections) {
                Paragraph sectionHeading = new Paragraph(row.heading).setFont(boldFont).setFontSize(12).setMarginTop(8);
                document.add(sectionHeading);

                List<IElement> elements = HtmlConverter.convertToElements(row.htmlContent, converterProperties);
                for (IElement element : elements) {
                    document.add((IBlockElement) element);
                }
            }

            document.close();
        } catch (IOException e) {
            throw new RuntimeException("Error creating PDF", e);
        }

        return new ByteArrayResource(outputStream.toByteArray());
    }
}
