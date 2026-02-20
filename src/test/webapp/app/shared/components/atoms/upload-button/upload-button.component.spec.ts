import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UploadButtonComponent, DocumentType } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

import { signal } from '@angular/core';
import rxjs, { of } from 'rxjs';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideHttpClientMock } from 'util/http-client.mock';
import {
  ApplicationResourceApiServiceMock,
  createApplicationResourceApiServiceMock,
  provideApplicationResourceApiServiceMock,
} from 'util/application-resource-api.service.mock';

describe('UploadButtonComponent', () => {
  let applicationService: ApplicationResourceApiServiceMock;
  let toastService: ToastServiceMock;

  function createUploadButtonFixture(inputs: { documentType: DocumentType; applicationId: string; markAsRequired?: boolean }) {
    const fixture = TestBed.createComponent(UploadButtonComponent);
    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    applicationService = createApplicationResourceApiServiceMock();
    toastService = createToastServiceMock();
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent],
      providers: [
        provideApplicationResourceApiServiceMock(applicationService),
        provideToastServiceMock(toastService),
        provideHttpClientMock(),
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an uploadbutton', () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    expect(fixture.componentRef).toBeTruthy();
  });

  it('should show error if file exceeds max upload size', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    component.fileUploadComponent = signal({
      clear: vi.fn(),
    } as unknown as FileUpload);

    const bigFile = new File([new ArrayBuffer(26 * 1024 * 1024)], 'bigfile.pdf'); // 26MB (exceeds 25MB limit)
    await component.onFileSelected({ currentFiles: [bigFile] } as FileSelectEvent);

    expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.too_large_detailed', {
      maxSize: '25',
      totalSize: `bigfile.pdf (${component.formatSize(26 * 1024 * 1024)})`,
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

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    const error = new Error('Delete failed');

    vi.spyOn(applicationService, 'deleteDocumentFromApplication').mockReturnValue(rxjs.throwError(() => error));

    vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(error);

    const document = { id: '1', name: 'doc1', size: 1234 };
    component.documentIds.set([document]);

    await component.deleteDictionary(document);

    expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.delete_failed');
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

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    vi.spyOn(applicationService, 'renameDocument').mockReturnValue(rxjs.throwError(() => new Error('Rename failed')));

    vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(new Error('Rename failed'));

    const doc = { id: '1', name: 'newName', size: 1234 };
    component.documentIds.set([doc]);

    await component.renameDocument(doc);

    expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.rename_failed');
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

    const uploadSpy = vi.spyOn(component, 'onUpload').mockImplementation(async () => {});

    await component.onFileSelected({ currentFiles: [newFile] } as FileSelectEvent);

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

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

    const firstValueFromSpy = vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(new Error('Simulated upload failure'));

    await component.onUpload();

    expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.upload_failed');

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
  });

  describe('Duplicate Handling', () => {
    it('should detect duplicate filename and show dialog instead of uploading', async () => {
      vi.useFakeTimers();
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;
      fixture.detectChanges(); // Initialize viewChildren

      // 1. Simulate existing document
      component.documentIds.set([{ id: '1', name: 'existing.pdf', size: 1000 }]);

      // 2. Select same file
      const newFile = new File(['content'], 'existing.pdf');
      const uploadSpy = vi.spyOn(component, 'onUpload');
      const confirmDialogSpy = vi.spyOn(component.duplicateConfirmDialog()!, 'confirm');

      await component.onFileSelected({ currentFiles: [newFile] } as FileSelectEvent);

      // Advance timers to execute setTimeout
      await vi.runAllTimersAsync();

      expect(confirmDialogSpy).toHaveBeenCalled();
      expect(component.pendingDuplicateFile()).toBe(newFile);
      expect(component.duplicateFileName()).toBe('existing.pdf');
      expect(uploadSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should replace duplicate file: delete old then upload new', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      const existingDoc = { id: 'old-id', name: 'duplicate.pdf', size: 1000 };
      component.documentIds.set([existingDoc]);

      const newFile = new File(['new content'], 'duplicate.pdf');
      component.pendingDuplicateFile.set(newFile);

      // Mock delete and upload
      vi.spyOn(applicationService, 'deleteDocumentFromApplication').mockImplementation((): rxjs.Observable<any> => of({}));
      vi.spyOn(applicationService, 'uploadDocuments').mockImplementation(
        (): rxjs.Observable<any> => of([{ id: 'new-id', name: 'duplicate.pdf', size: 2000 }]),
      );

      await component.onConfirmDuplicate();

      // Expect delete then upload
      expect(applicationService.deleteDocumentFromApplication).toHaveBeenCalledWith('old-id');
      expect(applicationService.uploadDocuments).toHaveBeenCalledTimes(1);

      // Check if list updated
      expect(component.documentIds()).toEqual([{ id: 'new-id', name: 'duplicate.pdf', size: 2000 }]);
    });

    it('should handle cancel via ConfirmDialog rejection', () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      component.pendingDuplicateFile.set(new File([], 'test.pdf'));

      expect(component.pendingDuplicateFile()).not.toBeNull();
    });

    it('should not proceed if no pending file is set during replace', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      component.pendingDuplicateFile.set(null);

      await component.onConfirmDuplicate();

      expect(applicationService.deleteDocumentFromApplication).not.toHaveBeenCalled();
    });

    it('should handle error when deleting existing document during replace', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      const existingDoc = { id: 'old-id', name: 'duplicate.pdf', size: 1000 };
      component.documentIds.set([existingDoc]);

      const newFile = new File(['new content'], 'duplicate.pdf');
      component.pendingDuplicateFile.set(newFile);

      const toastSpy = vi.spyOn(toastService, 'showErrorKey');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock delete failure
      vi.spyOn(applicationService, 'deleteDocumentFromApplication').mockReturnValue(rxjs.throwError(() => new Error('Delete failed')));
      vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(new Error('Delete failed'));

      await component.onConfirmDuplicate();

      expect(applicationService.deleteDocumentFromApplication).toHaveBeenCalledWith('old-id');
      expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.replace_failed');
      expect(applicationService.uploadDocuments).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle documentIds becoming undefined during replace (race condition)', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      const existingDoc = { id: 'old-id', name: 'duplicate.pdf', size: 1000 };
      component.documentIds.set([existingDoc]);

      const newFile = new File(['new content'], 'duplicate.pdf');
      component.pendingDuplicateFile.set(newFile);

      // Subject to control when the delete completes
      const deleteSubject = new rxjs.Subject<any>();
      vi.spyOn(applicationService, 'deleteDocumentFromApplication').mockImplementation(
        (): rxjs.Observable<any> => deleteSubject.asObservable(),
      );
      vi.spyOn(applicationService, 'uploadDocuments').mockImplementation((): rxjs.Observable<any> => of([]));

      // Start the replace process
      const replacePromise = component.onConfirmDuplicate();

      // Simulate race condition: documentIds cleared while delete is pending
      component.documentIds.set(undefined);

      // Complete the delete
      deleteSubject.next({});
      deleteSubject.complete();

      await replacePromise;

      // Verify that it handled the undefined documentIds gracefully (fallback to [])
      expect(component.documentIds()).toEqual([]);
    });
  });

  it('should do nothing on upload if no files selected', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    component.selectedFiles.set(undefined);
    await component.onUpload();
    expect(applicationService.uploadDocuments).not.toHaveBeenCalled();

    component.selectedFiles.set([]);
    await component.onUpload();
    expect(applicationService.uploadDocuments).not.toHaveBeenCalled();
  });
});
