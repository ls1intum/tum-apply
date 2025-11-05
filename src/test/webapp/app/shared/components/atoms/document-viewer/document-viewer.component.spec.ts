import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentViewerComponent } from '../../../../../../../main/webapp/app/shared/components/atoms/document-viewer/document-viewer.component';
import { DocumentResourceApiService } from 'app/generated/api/documentResourceApi.service';
import { DocumentCacheService } from 'app/service/document-cache.service';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { of, throwError } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const createMockDocumentInfo = (overrides?: Partial<DocumentInformationHolderDTO>): DocumentInformationHolderDTO => ({
  id: 'doc-123',
  size: 1024,
  ...overrides,
});

describe('DocumentViewerComponent', () => {
  let documentService: Pick<DocumentResourceApiService, 'downloadDocument'>;
  let cacheService: Pick<DocumentCacheService, 'get' | 'set'>;
  let domSanitizer: Pick<DomSanitizer, 'bypassSecurityTrustResourceUrl'>;
  let fixture: ComponentFixture<DocumentViewerComponent>;
  let comp: DocumentViewerComponent;
  let mockDocInfo: DocumentInformationHolderDTO;
  let mockSafeUrl: SafeResourceUrl;

  beforeEach(async () => {
    documentService = {
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
        { provide: DocumentResourceApiService, useValue: documentService },
        { provide: DocumentCacheService, useValue: cacheService },
        { provide: DomSanitizer, useValue: domSanitizer },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('documentDictionaryId', mockDocInfo);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should initialize with undefined sanitizedBlobUrl', () => {
    expect(comp.sanitizedBlobUrl()).toBeUndefined();
  });

  describe('initDocument', () => {
    it('should use cached document if available', async () => {
      cacheService.get = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
      expect(documentService.downloadDocument).not.toHaveBeenCalled();
    });

    it('should download document when not in cache', async () => {
      const mockBlob = new ArrayBuffer(100);
      documentService.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-123');
      expect(cacheService.set).toHaveBeenCalledWith('doc-123', expect.any(Blob));
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
    });

    it('should create PDF blob with correct type', async () => {
      const mockBlob = new ArrayBuffer(100);
      documentService.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockImplementation((_, blob) => {
        expect(blob.type).toBe('application/pdf');
        expect(blob.size).toBe(100);
        return mockSafeUrl;
      });

      await comp.initDocument();

      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should handle download error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      documentService.downloadDocument = vi.fn().mockReturnValue(throwError(() => new Error('Download failed')));

      await comp.initDocument();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Document download failed:', expect.any(Error));
      expect(comp.sanitizedBlobUrl()).toBeUndefined();
      consoleErrorSpy.mockRestore();
    });

    it('should set sanitizedBlobUrl to undefined on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      comp.sanitizedBlobUrl.set('previous-value' as unknown as SafeResourceUrl);
      documentService.downloadDocument = vi.fn().mockReturnValue(throwError(() => new Error('Network error')));

      await comp.initDocument();

      expect(comp.sanitizedBlobUrl()).toBeUndefined();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('documentDictionaryId input changes', () => {
    it('should initialize document when documentDictionaryId is set', async () => {
      cacheService.get = vi.fn().mockReturnValue(mockSafeUrl);
      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
    });

    it('should handle document with different IDs sequentially', async () => {
      const mockBlob = new ArrayBuffer(100);
      const mockDocInfo2 = createMockDocumentInfo({ id: 'doc-2' });
      const mockSafeUrl2 = domSanitizer.bypassSecurityTrustResourceUrl('blob:http://test/doc-2');

      documentService.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValueOnce(mockSafeUrl).mockReturnValueOnce(mockSafeUrl2);

      // Test first document
      fixture.componentRef.setInput('documentDictionaryId', mockDocInfo);
      await comp.initDocument();
      expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-123');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);

      // Test second document
      fixture.componentRef.setInput('documentDictionaryId', mockDocInfo2);
      await comp.initDocument();
      expect(documentService.downloadDocument).toHaveBeenCalledWith('doc-2');
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl2);
    });
  });

  describe('integration - cache behavior', () => {
    it('should use cache and skip download when document is cached', async () => {
      cacheService.get = vi.fn().mockReturnValue(mockSafeUrl);
      const downloadSpy = vi.spyOn(documentService, 'downloadDocument');

      await comp.initDocument();

      expect(cacheService.get).toHaveBeenCalledWith('doc-123');
      expect(downloadSpy).not.toHaveBeenCalled();
      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
    });

    it('should cache downloaded document', async () => {
      const mockBlob = new ArrayBuffer(200);
      documentService.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(cacheService.set).toHaveBeenCalledWith('doc-123', expect.any(Blob));
    });
  });

  describe('edge cases', () => {
    it('should handle empty document ID', async () => {
      mockDocInfo = createMockDocumentInfo({ id: '' });
      const mockBlob = new ArrayBuffer(100);
      fixture.componentRef.setInput('documentDictionaryId', mockDocInfo);
      cacheService.get = vi.fn().mockReturnValue(undefined);
      documentService.downloadDocument = vi.fn().mockReturnValue(of(mockBlob));
      cacheService.set = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(documentService.downloadDocument).toHaveBeenCalledWith('');
    });

    it('should handle very large documents', async () => {
      const size = 10485760; // 10MB
      mockDocInfo = createMockDocumentInfo({ id: 'large-doc', size: size });
      const largeBlob = new ArrayBuffer(size);
      fixture.componentRef.setInput('documentDictionaryId', mockDocInfo);
      documentService.downloadDocument = vi.fn().mockReturnValue(of(largeBlob));
      cacheService.set = vi.fn().mockReturnValue(mockSafeUrl);

      await comp.initDocument();

      expect(comp.sanitizedBlobUrl()).toBe(mockSafeUrl);
      expect(cacheService.set).toHaveBeenCalledWith('large-doc', expect.any(Blob));
    });
  });
});
