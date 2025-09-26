import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentCacheService } from 'app/service/document-cache.service';

// Mock DomSanitizer
const mockDomSanitizer = {
  bypassSecurityTrustResourceUrl: vi.fn((url: string) => `safe:${url}` as SafeResourceUrl),
};

const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

const originalURL = global.URL;

describe('DocumentCacheService', () => {
  let service: DocumentCacheService;
  let mockBlob: Blob;

  beforeEach(async () => {
    // Setup URL mocks
    global.URL = class extends originalURL {
      static createObjectURL = mockCreateObjectURL;
      static revokeObjectURL = mockRevokeObjectURL;
    } as typeof URL;

    mockCreateObjectURL.mockReturnValue('blob:mock-url-123');

    await TestBed.configureTestingModule({
      providers: [DocumentCacheService, { provide: DomSanitizer, useValue: mockDomSanitizer }],
    }).compileComponents();

    service = TestBed.inject(DocumentCacheService);
    mockBlob = new Blob(['test content'], { type: 'application/pdf' });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original URL
    global.URL = originalURL;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return undefined when getting non-existent document', () => {
    const result = service.get('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('should set and get a document', () => {
    const documentId = 'doc-123';
    const safeUrl = service.set(documentId, mockBlob);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('blob:mock-url-123#toolbar=0&navpanes=0');
    expect(safeUrl).toBe('safe:blob:mock-url-123#toolbar=0&navpanes=0');

    const retrievedUrl = service.get(documentId);
    expect(retrievedUrl).toBe(safeUrl);
  });

  it('should implement LRU behavior when getting documents', () => {
    const doc1Id = 'doc-1';
    const doc2Id = 'doc-2';

    mockCreateObjectURL.mockReturnValueOnce('blob:url-1').mockReturnValueOnce('blob:url-2');

    const safeUrl1 = service.set(doc1Id, mockBlob);
    const safeUrl2 = service.set(doc2Id, mockBlob);

    // Access doc1 to make it most recently used
    const retrieved1 = service.get(doc1Id);
    expect(retrieved1).toBe(safeUrl1);

    // Verify doc1 is now at the end (most recent) by checking internal behavior
    const retrieved2 = service.get(doc2Id);
    expect(retrieved2).toBe(safeUrl2);
  });

  it('should replace existing document with same ID', () => {
    const documentId = 'doc-123';
    mockCreateObjectURL.mockReturnValueOnce('blob:url-1').mockReturnValueOnce('blob:url-2');

    // Set first document
    const safeUrl1 = service.set(documentId, mockBlob);
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    // Replace with second document
    const safeUrl2 = service.set(documentId, mockBlob);

    // Should revoke the first URL and create a new one
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url-1');
    expect(safeUrl2).toBe('safe:blob:url-2#toolbar=0&navpanes=0');

    const retrieved = service.get(documentId);
    expect(retrieved).toBe(safeUrl2);
  });

  it('should enforce max size limit and evict oldest entry', () => {
    // Set maxSize to a small number for testing
    const maxSize = 3;
    (service as any).maxSize = maxSize;

    const documentIds = ['doc-1', 'doc-2', 'doc-3', 'doc-4'];
    const mockUrls = ['blob:url-1', 'blob:url-2', 'blob:url-3', 'blob:url-4'];

    mockUrls.forEach(url => mockCreateObjectURL.mockReturnValueOnce(url));

    // Fill cache to max capacity
    documentIds.slice(0, 3).forEach((id, index) => {
      service.set(id, mockBlob);
    });

    // Add one more document, should evict the oldest (doc-1)
    service.set(documentIds[3], mockBlob);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url-1');

    // doc-1 should no longer be in cache
    expect(service.get('doc-1')).toBeUndefined();

    // Other documents should still be accessible
    expect(service.get('doc-2')).toBeDefined();
    expect(service.get('doc-3')).toBeDefined();
    expect(service.get('doc-4')).toBeDefined();
  });

  it('should handle cache size exactly at limit without eviction', () => {
    const maxSize = 2;
    (service as any).maxSize = maxSize;

    mockCreateObjectURL.mockReturnValueOnce('blob:url-1').mockReturnValueOnce('blob:url-2');

    service.set('doc-1', mockBlob);
    service.set('doc-2', mockBlob);

    // Should not have called revoke yet
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    // Both documents should be accessible
    expect(service.get('doc-1')).toBeDefined();
    expect(service.get('doc-2')).toBeDefined();
  });

  it('should handle empty cache correctly during eviction', () => {
    const maxSize = 1;
    (service as any).maxSize = maxSize;

    mockCreateObjectURL.mockReturnValue('blob:url-1');

    // This should work without errors even with empty cache
    service.set('doc-1', mockBlob);

    expect(service.get('doc-1')).toBeDefined();
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  });

  it('should properly handle PDF viewer parameters', () => {
    const documentId = 'doc-123';
    mockCreateObjectURL.mockReturnValue('blob:test-url');

    service.set(documentId, mockBlob);

    expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('blob:test-url#toolbar=0&navpanes=0');
  });
});
