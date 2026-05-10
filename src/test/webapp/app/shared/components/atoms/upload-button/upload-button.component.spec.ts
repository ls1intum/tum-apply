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
  ApplicationResourceApiMock,
  createApplicationResourceApiMock,
  provideApplicationResourceApiMock,
} from 'util/application-resource-api.service.mock';
import {
  ApplicantResourceApiMock,
  createApplicantResourceApiMock,
  provideApplicantResourceApiMock,
} from 'util/applicant-resource-api.service.mock';

describe('UploadButtonComponent', () => {
  let applicationApi: ApplicationResourceApiMock;
  let applicantApi: ApplicantResourceApiMock;
  let toastService: ToastServiceMock;

  function createUploadButtonFixture(inputs: {
    documentType: DocumentType;
    applicationId: string;
    deferUpload?: boolean;
    allowMultiple?: boolean;
  }) {
    const fixture = TestBed.createComponent(UploadButtonComponent);
    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    applicationApi = createApplicationResourceApiMock();
    applicantApi = createApplicantResourceApiMock();
    toastService = createToastServiceMock();
    await TestBed.configureTestingModule({
      imports: [UploadButtonComponent],
      providers: [
        provideApplicationResourceApiMock(applicationApi),
        provideApplicantResourceApiMock(applicantApi),
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

    expect(applicationApi.deleteDocumentFromApplication).toHaveBeenCalledWith('1');
    expect(component.documentIds()).toEqual([doc2]);
  });

  it('should upload applicant profile documents when configured for applicant profile target', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'unused-app-id', documentType: 'CV' });
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('uploadTarget', 'applicantProfile');

    component.fileUploadComponent = signal({
      clear: vi.fn(),
    } as unknown as FileUpload);

    const uploadedDoc = [{ id: 'profile-doc-1', name: 'cv.pdf', size: 1234 }];
    applicantApi.uploadApplicantProfileDocuments.mockReturnValue(of(uploadedDoc));

    await component.onFileSelected({ currentFiles: [new File([''], 'cv.pdf', { type: 'application/pdf' })] } as FileSelectEvent);

    expect(applicantApi.uploadApplicantProfileDocuments).toHaveBeenCalledOnce();
    expect(applicantApi.uploadApplicantProfileDocuments).toHaveBeenCalledWith('CV', expect.any(File));
    expect(component.documentIds()).toEqual(uploadedDoc);
  });

  it('should delete applicant profile documents through the applicant endpoint', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'unused-app-id', documentType: 'CV' });
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('uploadTarget', 'applicantProfile');

    const document = { id: 'profile-doc-1', name: 'cv.pdf', size: 1234 };
    component.documentIds.set([document]);

    await component.deleteDictionary(document);

    expect(applicantApi.deleteApplicantProfileDocument).toHaveBeenCalledWith('profile-doc-1');
    expect(applicationApi.deleteDocumentFromApplication).not.toHaveBeenCalled();
    expect(component.documentIds()).toEqual([]);
  });

  it('should show error toast if deletion fails', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    const component = fixture.componentInstance;

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    const error = new Error('Delete failed');

    vi.spyOn(applicationApi, 'deleteDocumentFromApplication').mockReturnValue(rxjs.throwError(() => error));

    vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(error);

    const document = { id: '1', name: 'doc1', size: 1234 };
    component.documentIds.set([document]);

    await component.deleteDictionary(document);

    expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.delete_failed');
  });

  it('should skip renaming if name is empty', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const doc = { id: '1', name: '', size: 1234 };

    await component.renameDocument(doc);

    expect(applicationApi.renameDocument).not.toHaveBeenCalled();
  });

  it('should show error toast if renaming fails', async () => {
    const fixture = createUploadButtonFixture({ applicationId: 'app-id', documentType: 'CV' });
    const component = fixture.componentInstance;

    const toastSpy = vi.spyOn(toastService, 'showErrorKey');

    vi.spyOn(applicationApi, 'renameDocument').mockReturnValue(rxjs.throwError(() => new Error('Rename failed')));

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

  it('should remove a deferred queued file by placeholder id after renaming and deleting it', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV', deferUpload: true });
    const component = fixture.componentInstance;
    component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

    await component.onFileSelected({
      currentFiles: [new File(['old-content'], 'original.pdf', { type: 'application/pdf' })],
    } as FileSelectEvent);

    const queuedDocument = component.documentIds()![0];
    await component.renameDocument({ id: queuedDocument.id, name: 'renamed.pdf', size: queuedDocument.size });

    expect(component.documentIds()![0].name).toBe('renamed.pdf');
    expect(component.queuedFiles()[0].name).toBe('renamed.pdf');

    await component.deleteDictionary(component.documentIds()![0]);

    expect(component.documentIds()).toEqual([]);
    expect(component.queuedFiles()).toEqual([]);
    expect(applicationApi.deleteDocumentFromApplication).not.toHaveBeenCalled();
  });

  it('should replace a deferred renamed placeholder by id without leaving the old queued file behind', async () => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV', deferUpload: true });
    const component = fixture.componentInstance;
    component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

    await component.onFileSelected({ currentFiles: [new File(['old'], 'original.pdf', { type: 'application/pdf' })] } as FileSelectEvent);

    const queuedDocument = component.documentIds()![0];
    await component.renameDocument({ id: queuedDocument.id, name: 'renamed.pdf', size: queuedDocument.size });

    const replacementFile = new File(['replacement-content'], 'renamed.pdf', { type: 'application/pdf' });
    component.pendingDuplicateFile.set(replacementFile);

    await component.onConfirmDuplicate();

    expect(component.documentIds()).toHaveLength(1);
    expect(component.documentIds()![0].name).toBe('renamed.pdf');
    expect(component.queuedFiles()).toHaveLength(1);
    expect(component.queuedFiles()[0].size).toBe(replacementFile.size);
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

      await component.onFileSelected({ currentFiles: [newFile] } as FileSelectEvent);

      // Advance timers to execute setTimeout
      await vi.runAllTimersAsync();

      expect(component.showDuplicateDialog()).toBe(true);
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
      vi.spyOn(applicationApi, 'deleteDocumentFromApplication').mockImplementation((): rxjs.Observable<any> => of({}));
      vi.spyOn(applicationApi, 'uploadDocuments').mockImplementation(
        (): rxjs.Observable<any> => of([{ id: 'new-id', name: 'duplicate.pdf', size: 2000 }]),
      );

      await runSilently(() => component.onConfirmDuplicate());

      // Expect delete then upload
      expect(applicationApi.deleteDocumentFromApplication).toHaveBeenCalledWith('old-id');
      expect(applicationApi.uploadDocuments).toHaveBeenCalledOnce();

      // Check if list updated
      expect(component.documentIds()).toEqual([{ id: 'new-id', name: 'duplicate.pdf', size: 2000 }]);
    });

    it('should not proceed if no pending file is set during replace', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      component.pendingDuplicateFile.set(null);

      await runSilently(() => component.onConfirmDuplicate());

      expect(applicationApi.deleteDocumentFromApplication).not.toHaveBeenCalled();
    });

    it('should handle error when deleting existing document during replace', async () => {
      const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
      const component = fixture.componentInstance;

      const existingDoc = { id: 'old-id', name: 'duplicate.pdf', size: 1000 };
      component.documentIds.set([existingDoc]);

      const newFile = new File(['new content'], 'duplicate.pdf');
      component.pendingDuplicateFile.set(newFile);

      const toastSpy = vi.spyOn(toastService, 'showErrorKey');

      // Mock delete failure
      vi.spyOn(applicationApi, 'deleteDocumentFromApplication').mockReturnValue(rxjs.throwError(() => new Error('Delete failed')));
      vi.spyOn(rxjs, 'firstValueFrom').mockRejectedValue(new Error('Delete failed'));

      await component.onConfirmDuplicate();

      expect(applicationApi.deleteDocumentFromApplication).toHaveBeenCalledWith('old-id');
      expect(toastSpy).toHaveBeenCalledWith('entity.upload.error.replace_failed');
      expect(applicationApi.uploadDocuments).not.toHaveBeenCalled();
    });

  });

  it.each<File[] | undefined>([undefined, []])('should do nothing on upload when selectedFiles=%s', async selected => {
    const fixture = createUploadButtonFixture({ applicationId: '1234', documentType: 'CV' });
    fixture.componentInstance.selectedFiles.set(selected);
    await fixture.componentInstance.onUpload();
    expect(applicationApi.uploadDocuments).not.toHaveBeenCalled();
  });

  describe('Auth gate via requestAuth', () => {
    it('should invoke requestAuth when applicationId is empty', async () => {
      const fixture = TestBed.createComponent(UploadButtonComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('documentType', 'CV');
      fixture.componentRef.setInput('applicationId', undefined);
      const trigger = vi.fn().mockImplementation(async () => {
        fixture.componentRef.setInput('applicationId', 'app-after-auth');
      });
      fixture.componentRef.setInput('requestAuth', trigger);
      fixture.detectChanges();

      component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

      await component.onFileSelected({ currentFiles: [new File([new ArrayBuffer(10)], 'cv.pdf')] } as FileSelectEvent);

      expect(trigger).toHaveBeenCalledOnce();
    });

    it.each<['missing callback' | 'rejected callback', (() => Promise<unknown>) | undefined]>([
      ['missing callback', undefined],
      ['rejected callback', () => Promise.reject(new Error('cancelled'))],
    ])('should not upload when applicationId is empty and %s', async (_desc, requestAuth) => {
      const fixture = TestBed.createComponent(UploadButtonComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('documentType', 'CV');
      fixture.componentRef.setInput('applicationId', undefined);
      if (requestAuth) {
        fixture.componentRef.setInput('requestAuth', requestAuth);
      }
      fixture.detectChanges();

      component.fileUploadComponent = signal({ clear: vi.fn() } as unknown as FileUpload);

      await component.onFileSelected({ currentFiles: [new File([new ArrayBuffer(10)], 'cv.pdf')] } as FileSelectEvent);

      expect(applicationApi.uploadDocuments).not.toHaveBeenCalled();
    });
  });
});
