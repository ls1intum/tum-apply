import { Component, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
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

import { ButtonComponent } from '../button/button.component';

const DocumentType = {
  BACHELOR_TRANSCRIPT: 'BACHELOR_TRANSCRIPT',
  MASTER_TRANSCRIPT: 'MASTER_TRANSCRIPT',
  REFERENCE: 'REFERENCE',
  CV: 'CV',
  CUSTOM: 'CUSTOM',
} as const;

type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

@Component({
  selector: 'jhi-upload-button',
  imports: [FontAwesomeModule, FormsModule, SharedModule, FileUpload, ButtonComponent, TooltipModule, TranslateModule, TranslateDirective],
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
  documentIds = model<DocumentInformationHolderDTO[] | undefined>();
  valid = output<boolean>();

  selectedFiles = signal<File[] | undefined>(undefined);
  isUploading = signal<boolean>(false);
  disabled = computed(() => (this.documentIds()?.length ?? 0) > 0);

  private applicationService = inject(ApplicationResourceApiService);
  private toastService = inject(ToastService);

  async onFileSelected(event: any): Promise<void> {
    const files: File[] = event.currentFiles;
    const selectedFile = this.selectedFiles();
    if (selectedFile === undefined) {
      this.selectedFiles.set(files);
    } else {
      this.selectedFiles.set([...selectedFile, ...files]);
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.maxUploadSizeInMb * 1024 * 1024) {
      this.toastService.showError({ summary: 'Error', detail: 'Files are too large' });
      this.selectedFiles.set(undefined);
    }
    this.fileUploadComponent()?.clear();
    await this.onUpload();
  }

  async onUpload(): Promise<void> {
    const files: File[] | undefined = this.selectedFiles();
    if (!files) return;

    this.isUploading.set(true);
    try {
      const uploadedIds: DocumentInformationHolderDTO[] = await firstValueFrom(
        this.applicationService.uploadDocuments(this.applicationId(), this.documentType(), files),
      );
      this.documentIds.set(uploadedIds);
      this.selectedFiles.set([]);
    } catch (err) {
      console.error('Upload failed', err);
      this.toastService.showError({ summary: 'Error', detail: 'Upload failed' });
    } finally {
      this.isUploading.set(false);
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
      this.toastService.showError({ summary: 'Error', detail: 'Failed to delete document' });
    }
  }

  onClear(): void {
    this.isUploading.set(false);
  }

  async deleteAll(): Promise<void> {
    try {
      await firstValueFrom(this.applicationService.deleteDocumentBatchByTypeFromApplication(this.applicationId(), this.documentType()));
      this.selectedFiles.set([]);
    } catch (err) {
      console.error('Failed to delete documents', err);
      this.toastService.showError({ summary: 'Error', detail: 'Failed to delete documents' });
    }
  }

  async renameDocument(documentInfo: DocumentInformationHolderDTO): Promise<void> {
    const newName = documentInfo.name ?? '';
    if (!newName) {
      return;
    }

    const documentId = documentInfo.id;
    try {
      await firstValueFrom(this.applicationService.renameDocument(documentId, newName));
      const updatedDocs = this.documentIds()?.map(doc => (doc.id === documentId ? { ...doc, name: newName } : doc)) ?? [];
      this.documentIds.set(updatedDocs);
    } catch (err) {
      console.error('Failed to rename document', err);
      this.toastService.showError({ summary: 'Error', detail: 'Failed to rename document' });
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString() + ' ' + sizes[i];
  }
}
