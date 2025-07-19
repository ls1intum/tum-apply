import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentResourceService } from 'app/generated';
import { of, throwError } from 'rxjs';

import { DocumentViewerComponent } from './document-viewer.component';

class MockDocumentResourceService {
  downloadDocument = jest.fn().mockReturnValue(of({}));
}

describe('DocumentViewerComponent', () => {
  let component: DocumentViewerComponent;
  let fixture: ComponentFixture<DocumentViewerComponent>;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(async () => {
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/blob-id');
    await TestBed.configureTestingModule({
      imports: [DocumentViewerComponent],
      providers: [
        {
          provide: DocumentResourceService,
          useClass: MockDocumentResourceService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('documentDictionaryId', 'example-id-13143');
    fixture.detectChanges();
  });

  afterAll(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
  });

  it('should create', () => {
    fixture.componentRef.setInput('documentDictionaryId', 'test-id');
    expect(component).toBeTruthy();
  });

  it('should call downloadDocument with the provided documentDictionaryId', () => {
    const service = TestBed.inject(DocumentResourceService) as jest.Mocked<DocumentResourceService>;
    const expectedId = { id: 'example-id-999', size: 230 };
    fixture.componentRef.setInput('documentDictionaryId', expectedId);
    fixture.detectChanges();

    expect(service.downloadDocument).toHaveBeenCalledWith(expectedId.id);
  });

  it('should show "Nothing to display" when pdfSrc is undefined', () => {
    component.sanitizedBlobUrl.set(undefined);
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('p');
    expect(message?.textContent).toContain('Nothing to display');
  });

  it('should not throw if downloadDocument fails', async () => {
    const service = TestBed.inject(DocumentResourceService) as jest.Mocked<DocumentResourceService>;
    service.downloadDocument.mockReturnValueOnce(throwError(() => new Error('Download failed')));

    fixture.componentRef.setInput('documentDictionaryId', 'error-case');
    fixture.detectChanges();

    await fixture.whenStable();
    expect(component.sanitizedBlobUrl()).toBe(undefined); // expected fallback behavior
  });
});
