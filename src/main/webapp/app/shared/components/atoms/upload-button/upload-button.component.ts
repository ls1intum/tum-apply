import { Component, ElementRef, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService } from 'app/service/toast-service';
import { FileUpload } from 'primeng/fileupload';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { FileSelectEvent } from 'primeng/fileupload';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';

import { ButtonComponent } from '../button/button.component';

const DocumentType = {
  BACHELOR_TRANSCRIPT: 'BACHELOR_TRANSCRIPT',
  MASTER_TRANSCRIPT: 'MASTER_TRANSCRIPT',
  REFERENCE: 'REFERENCE',
  CV: 'CV',
  CUSTOM: 'CUSTOM',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

/**
 * Generic PDF upload control used by applicant document flows.
 *
 * The component has two operating modes:
 * - immediate upload: accepted files are sent to the backend right away
 * - deferred upload: accepted files are represented locally and emitted to the parent for a later bulk submit
 *
 * Duplicate-name handling, replacement confirmation, local renaming, and size validation all live
 * here so the surrounding pages only need to provide the document type and current document list.
 */
@Component({
  selector: 'jhi-upload-button',
  imports: [FontAwesomeModule, FormsModule, FileUpload, ButtonComponent, TooltipModule, TranslateModule, TranslateDirective, ConfirmDialog],
  templateUrl: './upload-button.component.html',
  styleUrl: './upload-button.component.scss',
  standalone: true,
})
export class UploadButtonComponent {
  readonly maxUploadSizeInMb = 25;

  fileUploadComponent = viewChild<FileUpload>(FileUpload);

  documentType = input.required<DocumentType>();
  applicationId = input.required<string>();
  documentIds = model<DocumentInformationHolderDTO[] | undefined>();
  valid = output<boolean>();
  queuedFilesChange = output<File[]>();

  selectedFiles = signal<File[] | undefined>(undefined);
  isUploading = signal<boolean>(false);
  disabled = computed(() => (this.documentIds()?.length ?? 0) > 0);
  allowMultiple = input<boolean>(true);
  deferUpload = input<boolean>(false);
  queuedFilesById = signal<Map<string, File>>(new Map());
  queuedFiles = computed(() => Array.from(this.queuedFilesById().values()));

  // Duplicate dialog state
  pendingDuplicateFile = signal<File | null>(null);
  duplicateFileName = signal<string>('');

  // Replacement dialog state (for single file mode)
  pendingReplacementFiles = signal<File[]>([]);

  showDuplicateDialog = signal(false);
  showReplacementDialog = signal(false);

  private applicationService = inject(ApplicationResourceApiService);
  private toastService = inject(ToastService);
  private elementRef = inject(ElementRef);

  async onFileSelected(event: FileSelectEvent): Promise<void> {
    const files: File[] = event.currentFiles;

    // For single-file mode, check if document already exists
    if (!this.allowMultiple() && (this.documentIds()?.length ?? 0) > 0) {
      this.pendingReplacementFiles.set(files);
      this.showReplacementDialog.set(true);
      this.fileUploadComponent()?.clear();
      this.resetNativeFileInput();
      return;
    }

    // Check for duplicate filenames
    for (const file of files) {
      if (this.isDuplicateFilename(file.name)) {
        // Show confirmation dialog for duplicate
        this.pendingDuplicateFile.set(file);
        this.duplicateFileName.set(file.name);

        this.showDuplicateDialog.set(true);

        this.fileUploadComponent()?.clear();
        this.resetNativeFileInput();
        return;
      }
    }

    // No duplicates, proceed with upload
    await this.processFiles(files);
  }

  /**
   * Replaces the existing document that shares the same display name as the pending file.
   *
   * In deferred mode only local state is changed. In immediate mode the old server document is
   * deleted first so the UI state and persisted state stay aligned.
   */
  async onConfirmDuplicate(): Promise<void> {
    const pendingFile = this.pendingDuplicateFile();
    if (!pendingFile) {
      return;
    }

    // Find and delete the existing document with the same name
    const existingDoc = this.documentIds()?.find(doc => doc.name === pendingFile.name);
    if (existingDoc) {
      if (this.deferUpload()) {
        const updatedList = this.documentIds()?.filter(doc => doc.id !== existingDoc.id) ?? [];
        this.documentIds.set(updatedList);
        this.removeQueuedFileFor(existingDoc.id);
      } else {
        try {
          await firstValueFrom(this.applicationService.deleteDocumentFromApplication(existingDoc.id));
          const updatedList = this.documentIds()?.filter(doc => doc.id !== existingDoc.id) ?? [];
          this.documentIds.set(updatedList);
        } catch {
          this.toastService.showErrorKey('entity.upload.error.replace_failed');
          this.pendingDuplicateFile.set(null);
          return;
        }
      }
    }

    await this.processFiles([pendingFile]);
    this.pendingDuplicateFile.set(null);
  }

  /**
   * Handles the "replace current file" flow for single-file document types such as CV.
   *
   * Existing entries are cleared first, then the newly selected file is processed as a normal
   * upload or deferred queue addition.
   */
  async onConfirmReplacement(): Promise<void> {
    const pendingFiles = this.pendingReplacementFiles();
    if (pendingFiles.length === 0) {
      return;
    }

    // Delete all existing documents (for single-file mode replacement)
    const existingDocs = this.documentIds() ?? [];
    if (this.deferUpload()) {
      this.documentIds.set([]);
      this.queuedFilesById.set(new Map());
      this.emitQueuedFilesChange();
    } else {
      for (const doc of existingDocs) {
        try {
          await firstValueFrom(this.applicationService.deleteDocumentFromApplication(doc.id));
        } catch {
          this.toastService.showErrorKey('entity.upload.error.replace_failed');
          return;
        }
      }

      // Clear the document list before uploading new file
      this.documentIds.set([]);
    }

    await this.processFiles(pendingFiles);
    this.pendingReplacementFiles.set([]);
  }

  async onUpload(): Promise<void> {
    const files: File[] | undefined = this.selectedFiles();
    if (!files || files.length === 0) return;

    this.isUploading.set(true);
    try {
      const uploadedPromises = files.map(file =>
        firstValueFrom(this.applicationService.uploadDocuments(this.applicationId(), this.documentType(), file)),
      );
      const uploadResults = await Promise.all(uploadedPromises);
      const allUploadedIds = uploadResults.flat();
      this.documentIds.set(allUploadedIds);
      this.selectedFiles.set([]);
    } catch {
      this.toastService.showErrorKey('entity.upload.error.upload_failed');
    } finally {
      this.isUploading.set(false);
      this.resetNativeFileInput();
    }
  }

  /**
   * Deletes a persisted server document or, in deferred mode, removes the corresponding local placeholder.
   */
  async deleteDictionary(documentInfo: DocumentInformationHolderDTO): Promise<void> {
    const documentId = documentInfo.id;
    if (this.deferUpload()) {
      const updatedList = this.documentIds()?.filter(doc => doc.id !== documentId) ?? [];
      this.documentIds.set(updatedList);
      this.removeQueuedFileFor(documentId);
      return;
    }

    try {
      await firstValueFrom(this.applicationService.deleteDocumentFromApplication(documentId));
      const updatedList = this.documentIds()?.filter(doc => doc.id !== documentId) ?? [];
      this.documentIds.set(updatedList);
    } catch {
      this.toastService.showErrorKey('entity.upload.error.delete_failed');
    }
  }

  onClear(): void {
    this.isUploading.set(false);
    this.resetNativeFileInput();
  }

  /**
   * Persists an inline filename edit when possible.
   *
   * Deferred mode only updates local placeholder data because there is nothing on the server yet.
   */
  async renameDocument(documentInfo: DocumentInformationHolderDTO): Promise<void> {
    const newName = documentInfo.name ?? '';
    if (!newName) {
      return;
    }

    const documentId = documentInfo.id;
    if (this.deferUpload()) {
      const updatedDocs =
        this.documentIds()?.map(doc =>
          doc.id === documentId
            ? {
                id: doc.id,
                name: newName,
                size: doc.size,
              }
            : doc,
        ) ?? [];
      this.documentIds.set(updatedDocs);
      this.renameQueuedFile(documentId, newName);
      return;
    }

    try {
      await firstValueFrom(this.applicationService.renameDocument(documentId, newName));
      const updatedDocs =
        this.documentIds()?.map(doc =>
          doc.id === documentId
            ? {
                id: doc.id,
                name: newName,
                size: doc.size,
              }
            : doc,
        ) ?? [];
      this.documentIds.set(updatedDocs);
    } catch {
      this.toastService.showErrorKey('entity.upload.error.rename_failed');
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const size = bytes / Math.pow(k, i);
    return `${parseFloat(size.toFixed(1))} ${sizes[i]}`;
  }

  private isDuplicateFilename(filename: string): boolean {
    const existingDocs = this.documentIds() ?? [];
    return existingDocs.some(doc => doc.name === filename);
  }

  /**
   * Validates incoming files and normalizes them into the component's state model.
   *
   * The main distinction here is:
   * - deferred mode: create temporary `documentIds` entries and keep the real `File` objects in `queuedFiles`
   * - immediate mode: stage files in `selectedFiles` and then call `onUpload()`
   *
   * Total-size validation includes both already persisted documents and newly chosen files so the UI
   * cannot drift past the same overall limit through multiple smaller additions.
   */
  private async processFiles(files: File[]): Promise<void> {
    const maxSizeBytes = this.maxUploadSizeInMb * 1024 * 1024;
    const maxTotalSizeMb = this.maxUploadSizeInMb; // total limit (MB) — same as per-file by design
    const maxTotalSizeBytes = maxTotalSizeMb * 1024 * 1024;

    // Validate incoming files individually first (always enforce per-file limit)
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        this.toastService.showErrorKey('entity.upload.error.too_large_detailed', {
          maxSize: this.maxUploadSizeInMb.toString(),
          totalSize: `${file.name} (${this.formatSize(file.size)})`,
        });
        this.fileUploadComponent()?.clear();
        this.resetNativeFileInput();
        return;
      }
    }

    // Consider already selected files when calculating the total size
    const selectedFile = this.deferUpload() ? this.queuedFiles() : (this.selectedFiles() ?? []);

    const combinedFiles = selectedFile.concat(files);
    const combinedFilesTotal = combinedFiles.reduce((sum, file) => sum + file.size, 0);

    // Also include already uploaded documents (persisted on the server) in the total size
    const existingDocs = this.documentIds() ?? [];
    const existingDocsTotal = existingDocs.reduce((sum, doc) => sum + doc.size, 0);

    const totalSize = existingDocsTotal + combinedFilesTotal;

    // Enforce combined total size limit
    if (totalSize > maxTotalSizeBytes) {
      this.toastService.showErrorKey('entity.upload.error.total_too_large', {
        maxTotal: maxTotalSizeMb.toString(),
        actualTotal: this.formatSize(totalSize),
      });
      this.fileUploadComponent()?.clear();
      this.resetNativeFileInput();
      return;
    }

    if (this.deferUpload()) {
      const updatedQueuedFiles = new Map(this.queuedFilesById());
      const tempDocumentEntries: DocumentInformationHolderDTO[] = files.map(file => {
        const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        updatedQueuedFiles.set(id, file);
        return {
          id,
          name: file.name,
          size: file.size,
        };
      });
      const updatedList = (this.documentIds() ?? []).concat(tempDocumentEntries);
      this.documentIds.set(updatedList);
      this.queuedFilesById.set(updatedQueuedFiles);
      this.emitQueuedFilesChange();
      this.fileUploadComponent()?.clear();
      this.resetNativeFileInput();
      return;
    }

    // Only add files if validation passes
    this.selectedFiles.set(combinedFiles);

    this.fileUploadComponent()?.clear();
    this.resetNativeFileInput();
    await this.onUpload();
  }

  private resetNativeFileInput(): void {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const nativeInput = this.elementRef.nativeElement.querySelector('input[type="file"]');
      if (nativeInput !== null) {
        nativeInput.value = '';
      }
    }, 0);
  }

  /**
   * Keeps the deferred upload queue in sync with the placeholder row removed from `documentIds`.
   */
  private removeQueuedFileFor(documentId: string): void {
    const filesById = this.queuedFilesById();
    if (!filesById.has(documentId)) {
      return;
    }
    const updated = new Map(filesById);
    updated.delete(documentId);
    this.queuedFilesById.set(updated);
    this.emitQueuedFilesChange();
  }

  private renameQueuedFile(documentId: string, newName: string): void {
    const queuedFile = this.queuedFilesById().get(documentId);
    if (!queuedFile || queuedFile.name === newName) {
      return;
    }

    const renamedFile = new File([queuedFile], newName, {
      type: queuedFile.type,
      lastModified: queuedFile.lastModified,
    });
    const updated = new Map(this.queuedFilesById());
    updated.set(documentId, renamedFile);
    this.queuedFilesById.set(updated);
    this.emitQueuedFilesChange();
  }

  private emitQueuedFilesChange(): void {
    this.queuedFilesChange.emit(this.queuedFiles());
  }
}
