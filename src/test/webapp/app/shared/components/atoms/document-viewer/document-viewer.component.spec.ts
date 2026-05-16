import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentViewerComponent } from '../../../../../../../main/webapp/app/shared/components/atoms/document-viewer/document-viewer.component';
import { DocumentResourceApi } from 'app/generated/api/document-resource-api';
import { DocumentCacheService } from 'app/service/document-cache.service';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { of, throwError } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const createMockDocumentInfo = (overrides?: Partial<DocumentInformationHolderDTO>): DocumentInformationHolderDTO =>
  Object.assign(
    {
      id: 'doc-123',
      size: 1024,
    },
    overrides ?? {},
  );

describe('DocumentViewerComponent', () => {
  let documentApi: Pick<DocumentResourceApi, 'downloadDocument'>;
  let cacheService: Pick<DocumentCacheService, 'get' | 'set'>;
  let domSanitizer: Pick<DomSanitizer, 'bypassSecurityTrustResourceUrl'>;
  let fixture: ComponentFixture<DocumentViewerComponent>;
  let comp: DocumentViewerComponent;
  let mockDocInfo: DocumentInformationHolderDTO;
  let mockSafeUrl: SafeResourceUrl;

  beforeEach(async () => {
    documentApi = {
      downloadDocument: vi.fn(),
    };

    cacheService = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    };

    // Create a proper DomSanitizer mock that returns SafeResourceUrl objects
    domSanitizer = {
      bypassSecurityTrustResourceUrl: vi.fn((url: string) => {
        return { changingThisBreaksApplicationSecurity: url } as SafeResourceUrl;
      }),
    };

    mockDocInfo = createMockDocumentInfo();
    mockSafeUrl = domSanitizer.bypassSecurityTrustResourceUrl('blob:http://test/new-doc');

    await TestBed.configureTestingModule({
      imports: [DocumentViewerComponent],
      providers: [
        { provide: DocumentResourceApi, useValue: documentApi },
        { provide: DocumentCacheService, useValue: cacheService },
        { provide: DomSanitizer, useValue: domSanitizer },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('documentId', mockDocInfo);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initDocument', () => {
    it('should use cached document if available', async () => {
      cacheService.get = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
      expect(documentApi.downloadDocument).not.toHaveBeenCalled();
    });

    it('should download document when not in cache', async () => {
      const mockBlob = new ArrayBuffer(100);
      documentApi.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(documentApi.downloadDocument).toHaveBeenCalledWith('doc-123');
      expect(cacheService.set).toHaveBeenCalledWith('doc-123', expect.any(Blob));
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
    });

    it('should handle download error gracefully and reset sanitizedBlobUrl', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      comp.sanitizedBlobUrl.set('previous-value' as unknown as SafeResourceUrl);
      documentApi.downloadDocument = vi.fn().mockReturnValue(throwError(() => new Error('Download failed')));

      await comp.initDocument();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Document download failed:', expect.any(Error));
      expect(comp.sanitizedBlobUrl()).toBeUndefined();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('documentId input changes', () => {
    it('should handle document with different IDs sequentially', async () => {
      const mockBlob = new ArrayBuffer(100);
      const mockDocInfo2 = createMockDocumentInfo({ id: 'doc-2' });
      const mockSafeUrl2 = domSanitizer.bypassSecurityTrustResourceUrl('blob:http://test/doc-2');

      documentApi.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValueOnce(mockSafeUrl).mockReturnValueOnce(mockSafeUrl2);

      // Test first document
      fixture.componentRef.setInput('documentId', mockDocInfo);
      await comp.initDocument();
      expect(documentApi.downloadDocument).toHaveBeenCalledWith('doc-123');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);

      // Test second document
      fixture.componentRef.setInput('documentId', mockDocInfo2);
      await comp.initDocument();
      expect(documentApi.downloadDocument).toHaveBeenCalledWith('doc-2');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl2);
    });
  });
});
