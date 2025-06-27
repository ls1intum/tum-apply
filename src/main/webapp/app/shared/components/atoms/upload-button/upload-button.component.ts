import { Component, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationResourceService, DocumentInformationHolderDTO } from 'app/generated';
import { HttpEventType } from '@angular/common/http';
import SharedModule from 'app/shared/shared.module';

import { FileUpload } from 'primeng/fileupload';
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
  imports: [FontAwesomeModule, SharedModule, FileUpload, ButtonComponent],
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

  selectedFile = signal<File[] | undefined>(undefined);
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);

  private applicationService = inject(ApplicationResourceService);

  disabled = computed(() => this.documentIds()?.length ?? 0 > 0);

  onFileSelected(event: any) {
    console.log('here');
    const files: File[] = event.currentFiles;
    this.selectedFile.set(files);
    console.log(JSON.stringify(event));
    // Optional: You can validate size here before allowing upload
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.maxUploadSizeInMb * 1024 * 1024) {
      alert('Files are too large');
      this.selectedFile.set(undefined);
    }
    this.fileUploadComponent()?.clear();
  }

  onUpload(event: any) {
    console.log('here');
    const files: File[] | undefined = this.selectedFile();
    if (!files) return;
    this.isUploading.set(true);
    this.applicationService
      .uploadDocuments(this.applicationId(), this.documentType(), files, 'events', true)
      // .pipe(share())
      .subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const percentDone = Math.round((event.loaded / event.total) * 100);
            this.uploadProgress.set(percentDone);
          } else if (event.type === HttpEventType.Response) {
            console.log(JSON.stringify(event.body));
            const uploadedIds = event.body;
            this.documentIds.set(uploadedIds ?? []);
            this.selectedFile.set([]);
            this.isUploading.set(false);
          }
        },
        error: err => {
          console.error('Upload failed', err);
          alert('Upload failed');
          this.isUploading.set(false);
        },
      });
  }

  deleteDictionary(documentInfi: DocumentInformationHolderDTO) {
    // TODO delete
  }

  onClear() {
    this.selectedFile.set(undefined);
    this.uploadProgress.set(0);
    this.isUploading.set(false);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
