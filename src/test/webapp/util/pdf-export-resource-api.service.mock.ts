import { PdfExportResourceApiService } from 'app/generated/api/pdfExportResourceApi.service';
import { Provider } from '@angular/core';
import { vi, type Mock } from 'vitest';
import { of } from 'rxjs';

export interface PdfExportResourceApiServiceMock {
  exportApplicationToPDF: Mock;
}

export function createPdfExportResourceApiServiceMock(): PdfExportResourceApiServiceMock {
  return {
    exportApplicationToPDF: vi.fn().mockReturnValue(of({ headers: { get: () => null }, body: new Blob(['pdf']) })),
  };
}

export function providePdfExportResourceApiServiceMock(
  mock: PdfExportResourceApiServiceMock = createPdfExportResourceApiServiceMock(),
): Provider {
  return { provide: PdfExportResourceApiService, useValue: mock };
}
