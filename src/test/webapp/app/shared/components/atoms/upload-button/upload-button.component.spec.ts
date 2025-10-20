import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { UploadButtonComponent, DocumentType } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { FileUpload } from 'primeng/fileupload';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

import { signal } from '@angular/core';
import rxjs, { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

class MockHttpClient {
  get = vi.fn();
  post = vi.fn();
  put = vi.fn();
  delete = vi.fn();
}

class MockApplicationResourceApiService {
  uploadDocuments = vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }]));
  deleteDocumentFromApplication = vi.fn().mockReturnValue(of(void 0));
  renameDocument = vi.fn().mockReturnValue(of(void 0));
}

class MockToastService {
  showError = vi.fn();
}

describe('UploadButtonComponent', () => {
  let applicationService: Pick<ApplicationResourceApiService, 'uploadDocuments' | 'deleteDocumentFromApplication' | 'renameDocument'>;
  let toastService: Pick<ToastService, 'showError'>;

  function createUploadButtonFixture(inputs: {
    documentType: DocumentType,
    applicationId: string,
    markAsRequired?: boolean,
  }) {
    const fixture = TestBed.createComponent(UploadButtonComponent);
    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    applicationService = new MockApplicationResourceApiService();
    toastService = new MockToastService();
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent],
      providers: [
        { provide: ApplicationResourceApiService, useValue: applicationService },
        { provide: ToastService, useValue: toastService },
        { provide: HttpClient, useClass: MockHttpClient },
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        provideFontAwesomeTesting()],
    }).compileComponents();
  });

  it('should create an uploadbutton', () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    expect(fixture.componentRef).toBeTruthy();
  });

  it('should show error if file exceeds max upload size', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    component['toastService'].showError = vi.fn();

    component.fileUploadComponent = signal({
      clear: vi.fn(),
    } as unknown as FileUpload);

    const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'bigfile.pdf'); // 2MB
    await component.onFileSelected({ currentFiles: [bigFile] });

    expect(component['toastService'].showError).toHaveBeenCalledWith({
      summary: 'Error',
      detail: 'Files are too large',
    });
    expect(component.selectedFiles()).toBe(undefined);
  });

  it('should set documentIds after successful upload', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const mockDoc = [{ id: '1', name: 'Doc1', size: 1234 }];

    component.fileUploadComponent = signal({
      clear: vi.fn(),
    } as unknown as FileUpload);

    component.selectedFiles.set([new File([''], 'file1.pdf')]);

    const firstValueFromSpy = vi.spyOn(rxjs, 'firstValueFrom').mockResolvedValue(mockDoc);

    await component.onUpload();

    expect(component.documentIds()).toEqual(mockDoc);
    firstValueFromSpy.mockRestore();
  });

  it('should format bytes correctly', () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    expect(component.formatSize(0)).toBe('0 B');
    expect(component.formatSize(1024)).toBe('1 KB');
    expect(component.formatSize(1048576)).toBe('1 MB');
  });

  it('should delete a document and update the list', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const doc1 = { id: '1', name: 'doc1', size: 1234 };
    const doc2 = { id: '2', name: 'doc2', size: 5678 };
    component.documentIds.set([doc1, doc2]);

    await component.deleteDictionary(doc1);

    expect(applicationService.deleteDocumentFromApplication).toHaveBeenCalledWith('1');
    expect(component.documentIds()).toEqual([doc2]);
  });

  it('should show error toast if deletion fails', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const error = new Error('Delete failed');
    (applicationService.deleteDocumentFromApplication as any).mockReturnValue({
      subscribe: () => { throw error; }
    })

    const document = { id: '1', name: 'doc1', size: 1234 };
    component.documentIds.set([document]);

    await component.deleteDictionary(document);

    expect(toastService.showError).toHaveBeenCalledWith({
      summary: 'Error',
      detail: 'Failed to delete document',
    });
  });

  it('should set isUploading to false on clear', () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    component.isUploading.set(true);
    component.onClear();
    expect(component.isUploading()).toBe(false);
  });

  it('should rename a document and update documentIds', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const doc = { id: '1', name: 'oldName', size: 1234 };
    const renamedDoc = { id: '1', name: 'newName', size: 1234 };

    component.documentIds.set([doc]);

    await component.renameDocument({ ...doc, name: 'newName' });

    expect(applicationService.renameDocument).toHaveBeenCalledWith('1', 'newName');
    expect(component.documentIds()).toEqual([renamedDoc]);
  });

  it('should skip renaming if name is empty', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const doc = { id: '1', name: '', size: 1234 };

    await component.renameDocument(doc);

    expect(applicationService.renameDocument).not.toHaveBeenCalled();
  });

  it('should show error toast if renaming fails', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;
    (applicationService.renameDocument as any).mockImplementation(() => {
      throw new Error('Rename failed');
    });

    const doc = { id: '1', name: 'newName', size: 1234 };
    component.documentIds.set([doc]);

    await component.renameDocument(doc);

    expect(toastService.showError).toHaveBeenCalledWith({
      summary: 'Error',
      detail: 'Failed to rename document',
    });
  });

  it('should append new files if selectedFiles is already defined', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    component.fileUploadComponent = signal({
      clear: vi.fn(),
    } as unknown as FileUpload);

    const existingFile = new File([''], 'existing.pdf');
    component.selectedFiles.set([existingFile]);

    const newFile = new File([''], 'new.pdf');

    const uploadSpy = vi.spyOn(component, 'onUpload').mockImplementation(async () => { });

    await component.onFileSelected({ currentFiles: [newFile] });

    const result = component.selectedFiles();

    expect(result?.length).toBe(2);
    expect(result?.[0].name).toBe('existing.pdf');
    expect(result?.[1].name).toBe('new.pdf');

    uploadSpy.mockRestore();
  });

  it('should handle error during upload and show error toast', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const mockFile = new File(['test content'], 'test.pdf');
    component.selectedFiles.set([mockFile]);

    const toastSpy = vi.spyOn(component['toastService'], 'showError');

    component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

    const uploadError = new Error('Simulated upload failure');
    vi.spyOn(applicationService as any, 'uploadDocuments').mockReturnValue({
      subscribe: vi.fn(),
      pipe: vi.fn(),
      toPromise: vi.fn(),
    });

    const firstValueFromSpy = vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(new Error('Simulated upload failure'));
    await component.onUpload();

    expect(toastSpy).toHaveBeenCalledWith({
      summary: 'Error',
      detail: 'Upload failed',
    });

    expect(component.isUploading()).toBe(false);
    expect(component.documentIds()).toBe(undefined);
    firstValueFromSpy.mockRestore();
  });
  it('should not rename document if name is null or undefined', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const renameSpy = vi.spyOn(applicationService, 'renameDocument');

    const docWithUndefinedName = { id: '1', name: undefined } as any;
    await component.renameDocument(docWithUndefinedName);
    expect(renameSpy).not.toHaveBeenCalled();

    const docWithNullName = { id: '1', name: null } as any;
    await component.renameDocument(docWithNullName);
    expect(renameSpy).not.toHaveBeenCalled();
  });

  it('should rename document if name is valid and update documentIds correctly', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const docId = 'doc-1';
    const newName = 'UpdatedName';

    component.documentIds.set([
      { id: 'doc-1', name: 'OldName', size: 1000 },
      { id: 'doc-2', name: 'OtherDoc', size: 2000 },
    ]);


    await component.renameDocument({ id: docId, name: newName, size: 3 });

    const updatedDocs = component.documentIds();
    expect(updatedDocs?.length).toBe(2);
    expect(updatedDocs?.find(d => d.id === docId)?.name).toBe(newName);
    expect(updatedDocs?.find(d => d.id === 'doc-2')?.name).toBe('OtherDoc');
  });
  it('should handle deleteDictionary when documentIds is undefined (fallback to empty array)', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    await component.deleteDictionary({ id: 'doc-1', size: 1 });

    expect(component.documentIds()).toEqual([]);
  });

  it('should handle undefined documentIds in rename function', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const docId = 'doc-1';
    const newName = 'UpdatedName';

    component.documentIds.set(undefined);

    await component.renameDocument({ id: docId, name: newName, size: 1000 });

    const updatedDocs = component.documentIds();
    expect(updatedDocs?.length).toBe(0);
  })


});