package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.exception.UserDataExportException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

/**
 * General-purpose XLSX writer that streams workbooks straight into a ZIP entry.
 * Built on POI's streaming {@link SXSSFWorkbook} so memory stays bounded for
 * large exports — only a small window of rows is held in memory while the rest
 * spill to disk.
 *
 * <p>The header row is rendered in bold and the top row is frozen so non-technical
 * recipients can scroll long tables comfortably. Sits next to {@link PDFExportService}
 * and {@link ZipExportService} as one of the shared export primitives.
 */
@Service
@RequiredArgsConstructor
public class XlsxExportService {

    /** Sliding window size for the streaming workbook. */
    private static final int ROW_ACCESS_WINDOW = 200;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ZipExportService zipExportService;

    /**
     * Writes a one-sheet workbook into the ZIP at {@code entryPath}.
     *
     * @param zos       open ZIP output stream
     * @param entryPath path of the entry inside the ZIP, e.g. {@code "jobs_overview.xlsx"}
     * @param sheetName display name of the single sheet
     * @param headers   column headers (rendered bold, frozen)
     * @param rows      data rows; each row's length should match {@code headers.size()}
     */
    public void writeSheet(ZipOutputStream zos, String entryPath, String sheetName, List<String> headers, List<List<Object>> rows) {
        Map<String, SheetData> single = new LinkedHashMap<>();
        single.put(sheetName, new SheetData(headers, rows));
        writeWorkbook(zos, entryPath, single);
    }

    /**
     * Writes a multi-sheet workbook into the ZIP. Sheet order matches the iteration
     * order of the supplied map (use a {@link LinkedHashMap}).
     *
     * @param zos       open ZIP output stream
     * @param entryPath path of the entry inside the ZIP
     * @param sheets    map of sheet name to sheet data; iteration order is preserved
     */
    public void writeWorkbook(ZipOutputStream zos, String entryPath, Map<String, SheetData> sheets) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(ROW_ACCESS_WINDOW)) {
            workbook.setCompressTempFiles(true);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            var headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            for (Map.Entry<String, SheetData> entry : sheets.entrySet()) {
                SXSSFSheet sheet = workbook.createSheet(WorkbookUtil.createSafeSheetName(entry.getKey()));
                // Streaming sheets cannot autosize after rows are flushed; track all columns
                // so the few thousand visible rows can still be sized at the end.
                sheet.trackAllColumnsForAutoSizing();

                writeSheetContent(sheet, headerStyle, entry.getValue());
                autoSize(sheet, entry.getValue().headers().size());
                sheet.createFreezePane(0, 1);
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            workbook.write(buffer);
            zipExportService.addFileToZip(zos, entryPath, buffer.toByteArray());

            // SXSSFWorkbook writes temp files; release them.
            workbook.dispose();
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write XLSX entry " + entryPath, e);
        }
    }

    private void writeSheetContent(Sheet sheet, org.apache.poi.ss.usermodel.CellStyle headerStyle, SheetData data) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < data.headers().size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(data.headers().get(i));
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (List<Object> row : data.rows()) {
            Row r = sheet.createRow(rowIdx++);
            for (int i = 0; i < row.size(); i++) {
                writeCell(r.createCell(i), row.get(i));
            }
        }
    }

    private void writeCell(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
            return;
        }
        switch (value) {
            case String s -> cell.setCellValue(s);
            case Number n -> cell.setCellValue(n.doubleValue());
            case Boolean b -> cell.setCellValue(b);
            case LocalDate d -> cell.setCellValue(DATE_FMT.format(d));
            case LocalDateTime dt -> cell.setCellValue(DATE_TIME_FMT.format(dt));
            case Instant i -> cell.setCellValue(DATE_TIME_FMT.format(i.atZone(ZoneId.of("UTC")).toLocalDateTime()));
            default -> cell.setCellValue(value.toString());
        }
    }

    private void autoSize(SXSSFSheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            // Cap excessively wide columns so the spreadsheet stays usable.
            int width = sheet.getColumnWidth(i);
            int max = 60 * 256;
            if (width > max) {
                sheet.setColumnWidth(i, max);
            }
        }
    }

    /** Container for one sheet's data inside a multi-sheet workbook. */
    public record SheetData(List<String> headers, List<List<Object>> rows) {}
}
