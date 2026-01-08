import { Component, ElementRef, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
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
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';

import { ButtonComponent } from '../button/button.component';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

const DocumentType = {
  BACHELOR_TRANSCRIPT: 'BACHELOR_TRANSCRIPT',
  MASTER_TRANSCRIPT: 'MASTER_TRANSCRIPT',
  REFERENCE: 'REFERENCE',
  CV: 'CV',
  CUSTOM: 'CUSTOM',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

@Component({
  selector: 'jhi-upload-button',
  imports: [
    FontAwesomeModule,
    FormsModule,
    SharedModule,
    FileUpload,
    ButtonComponent,
    TooltipModule,
    TranslateModule,
    TranslateDirective,
    DialogComponent,
    ConfirmDialog,
  ],
  templateUrl: './upload-button.component.html',
  styleUrl: './upload-button.component.scss',
  standalone: true,
})
export class UploadButtonComponent {
  readonly maxUploadSizeInMb = 1;

  fileUploadComponent = viewChild<FileUpload>(FileUpload);

  uploadKey = input<string>('entity.upload.upload_instruction_standard');
  documentType = input.required<DocumentType>();
  applicationId = input.required<string>();
  markAsRequired = input<boolean>(false);
  documentIds = model<DocumentInformationHolderDTO[] | undefined>();
  valid = output<boolean>();

  selectedFiles = signal<File[] | undefined>(undefined);
  isUploading = signal<boolean>(false);
  disabled = computed(() => (this.documentIds()?.length ?? 0) > 0);

  // Duplicate dialog state
  showDuplicateDialog = signal<boolean>(false);
  pendingDuplicateFile = signal<File | null>(null);
  duplicateFileName = signal<string>('');

  private applicationService = inject(ApplicationResourceApiService);
  private toastService = inject(ToastService);
  private elementRef = inject(ElementRef);

  async onFileSelected(event: FileSelectEvent): Promise<void> {
    const files: File[] = event.currentFiles;

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

  onDuplicateCancel(): void {
    this.closeDuplicateDialog();
  }

  async onDuplicateReplace(): Promise<void> {
    const pendingFile = this.pendingDuplicateFile();
    if (!pendingFile) {
      this.closeDuplicateDialog();
      return;
    }

    // Find and delete the existing document with the same name
    const existingDoc = this.documentIds()?.find(doc => doc.name === pendingFile.name);
    if (existingDoc) {
      try {
        await firstValueFrom(this.applicationService.deleteDocumentFromApplication(existingDoc.id));
        const updatedList = this.documentIds()?.filter(doc => doc.id !== existingDoc.id) ?? [];
        this.documentIds.set(updatedList);
      } catch {
        this.toastService.showErrorKey('entity.upload.error.replace_failed');
        this.closeDuplicateDialog();
        return;
      }
    }

    this.closeDuplicateDialog();
    await this.processFiles([pendingFile]);
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
    } catch (err) {
      console.error('Upload failed', err);
      this.toastService.showErrorKey('entity.upload.error.upload_failed');
    } finally {
      this.isUploading.set(false);
      this.resetNativeFileInput();
    }
  }

  async deleteDictionary(documentInfo: DocumentInformationHolderDTO): Promise<void> {
    const documentId = documentInfo.id;
    try {
      await firstValueFrom(this.applicationService.deleteDocumentFromApplication(documentId));
      const updatedList = this.documentIds()?.filter(doc => doc.id !== documentId) ?? [];
      this.documentIds.set(updatedList);
    } catch (err) {
      console.error('Failed to delete document', err);
      this.toastService.showErrorKey('entity.upload.error.delete_failed');
    }
  }

  onClear(): void {
    this.isUploading.set(false);
    this.resetNativeFileInput();
  }

  async renameDocument(documentInfo: DocumentInformationHolderDTO): Promise<void> {
    const newName = documentInfo.name ?? '';
    if (!newName) {
      return;
    }

    const documentId = documentInfo.id;
    try {
      await firstValueFrom(this.applicationService.renameDocument(documentId, newName));
      const updatedDocs =
        this.documentIds()?.map(doc =>
          doc.id === documentId
            ? {
                ...doc,
                name: newName,
              }
            : doc,
        ) ?? [];
      this.documentIds.set(updatedDocs);
    } catch (err) {
      console.error('Failed to rename document', err);
      this.toastService.showErrorKey('entity.upload.error.rename_failed');
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString() + ' ' + sizes[i];
  }

  private isDuplicateFilename(filename: string): boolean {
    const existingDocs = this.documentIds() ?? [];
    return existingDocs.some(doc => doc.name === filename);
  }

  private closeDuplicateDialog(): void {
    this.showDuplicateDialog.set(false);
    this.pendingDuplicateFile.set(null);
    this.duplicateFileName.set('');
  }

  private async processFiles(files: File[]): Promise<void> {
    const selectedFile = this.selectedFiles();
    if (selectedFile === undefined) {
      this.selectedFiles.set(files);
    } else {
      this.selectedFiles.set([...selectedFile, ...files]);
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.maxUploadSizeInMb * 1024 * 1024) {
      this.toastService.showErrorKey('entity.upload.error.too_large');
      this.selectedFiles.set(undefined);
      this.resetNativeFileInput();
      return;
    }

    this.fileUploadComponent()?.clear();
    this.resetNativeFileInput();
    await this.onUpload();
  }

  /**
   * Reset the native file input to allow reselection of the same file.
   */
  private resetNativeFileInput(): void {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const nativeInput = this.elementRef.nativeElement.querySelector('input[type="file"]');
      if (nativeInput !== null) {
        nativeInput.value = '';
      }
    }, 0);
  }
}
