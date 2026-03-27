import { PdfExportResourceApi } from 'app/generated/api/pdf-export-resource-api';
import { Provider } from '@angular/core';
import { vi, type Mock } from 'vitest';
import { of } from 'rxjs';

export interface PdfExportResourceApiMock {
  exportApplicationToPDF: Mock;
}

export function createPdfExportResourceApiMock(): PdfExportResourceApiMock {
  return {
    exportApplicationToPDF: vi.fn().mockReturnValue(of({ headers: { get: () => null }, body: new Blob(['pdf']) })),
  };
}

export function providePdfExportResourceApiMock(
  mock: PdfExportResourceApiMock = createPdfExportResourceApiMock(),
): Provider {
  return { provide: PdfExportResourceApi, useValue: mock };
}
