package de.tum.cit.aet.core.service.export.admin;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.core.service.ZipExportService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AdminXlsxWriterTest {

    private static final String ENTRY = "test/sheet.xlsx";

    private final ZipExportService zipExportService = createZipService();
    private final AdminXlsxWriter writer = new AdminXlsxWriter(zipExportService);

    @Test
    void writesHeadersAndRowsThatRoundTripThroughPoi() throws IOException {
        ByteArrayOutputStream zipBytes = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(zipBytes)) {
            writer.writeSheet(
                zos,
                ENTRY,
                "Jobs",
                List.of("Title", "Date", "Count"),
                List.of(
                    List.<Object>of("Position A", LocalDate.of(2026, 4, 10), 7),
                    List.<Object>of("Position B", LocalDate.of(2026, 5, 1), 3)
                )
            );
            zos.finish();
        }

        byte[] xlsxBytes = extractEntry(zipBytes.toByteArray(), ENTRY);
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsxBytes))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(1);
            Sheet sheet = workbook.getSheetAt(0);
            assertThat(sheet.getSheetName()).isEqualTo("Jobs");
            assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Title");
            assertThat(sheet.getRow(0).getCell(2).getStringCellValue()).isEqualTo("Count");
            assertThat(sheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("Position A");
            assertThat(sheet.getRow(1).getCell(2).getNumericCellValue()).isEqualTo(7d);
            assertThat(sheet.getRow(2).getCell(0).getStringCellValue()).isEqualTo("Position B");
            // Header row should be frozen
            assertThat(sheet.getPaneInformation().getHorizontalSplitTopRow()).isEqualTo((short) 1);
        }
    }

    private static byte[] extractEntry(byte[] zipBytes, String entryName) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().equals(entryName)) {
                    return zis.readAllBytes();
                }
            }
        }
        throw new IllegalStateException("Entry not found: " + entryName);
    }

    private static ZipExportService createZipService() {
        // ZipExportService needs a DocumentService dependency we don't exercise here
        ZipExportService service = new ZipExportService(null);
        // Disable deterministic ZIP to keep the test independent of any application config
        ReflectionTestUtils.setField(service, "deterministicZip", false);
        return service;
    }
}
