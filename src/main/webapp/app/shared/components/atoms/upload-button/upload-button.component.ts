import {
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationResourceService } from 'app/generated';
import { HttpEventType, HttpUploadProgressEvent } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, share } from 'rxjs/operators';
import { of } from 'rxjs';
import SharedModule from 'app/shared/shared.module';

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
  imports: [FontAwesomeModule, SharedModule],
  templateUrl: './upload-button.component.html',
  styleUrl: './upload-button.component.scss',
  standalone: true,
})
export class UploadButtonComponent {
  readonly maxUploadSizeInMb = 1;

  fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  uploadKey = input<string>('entity.upload.upload_instruction_standard');
  documentType = input.required<DocumentType>();
  applicationId = input.required<string>();

  documentIds = model<string[] | undefined>();

  selectedFile = signal<File[] | undefined>(undefined);
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);
  isDragOver = signal(false);

  valid = output<boolean>();

  disabled = computed<boolean>(() => {
    const documentIds = this.documentIds();
    return documentIds !== undefined && documentIds.length !== 0;
  });

  private applicationService = inject(ApplicationResourceService);
  private injector = inject(Injector);

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const fileList: File[] = Array.from(fileInput.files);
      this.selectedFile.set(fileList);
    }
    this.uploadFile();
  }

  uploadFile(): void {
    const files = this.selectedFile();
    if (!files) return;

    let totalSize = 0;
    files.forEach(f => (totalSize += f.size));
    if (totalSize > this.maxUploadSizeInMb * 1024 * 1024) {
      alert('The total size of the file(s) being uploaded is too large. Upload aborted.');
      return;
    }

    this.isUploading.set(true);
    const upload$ = this.applicationService.uploadDocuments(this.applicationId(), this.documentType(), files, 'events', true).pipe(share());

    runInInjectionContext(this.injector, () => {
      const progress$ = upload$.pipe(
        filter((event): event is HttpUploadProgressEvent => event.type === HttpEventType.UploadProgress),
        map(event => {
          if (event.total) {
            return Math.round((event.loaded / event.total) * 100);
          }
          return 0;
        }),
      );

      const uploadProgressSignal = toSignal(progress$, { initialValue: 0 });

      effect(() => {
        this.uploadProgress.set(uploadProgressSignal());
      });

      const response$ = upload$.pipe(
        filter(event => event.type === HttpEventType.Response),
        map(event => event.body),
        catchError(err => {
          this.isUploading.set(false);
          console.error('Upload failed:', err);
          alert('Upload failed. Please try again later');
          return of(null);
        }),
      );

      const uploadResponseSignal = toSignal(response$, { initialValue: null });
      effect(() => {
        const response = uploadResponseSignal();
        if (response) {
          this.isUploading.set(false);
          this.documentIds.set([...response]);
        }
      });
    });
  }

  triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(event.dataTransfer.files);
      this.selectedFile.set(files);
      this.uploadFile();
      event.dataTransfer.clearData();
    }
  }
}
