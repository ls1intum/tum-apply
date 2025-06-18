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

  documentIdLength = computed<number>(() => {
    return this.documentIds()?.length ?? 0;
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
    if (!files) return; // Exit if no files are selected

    // Calculate the total size of all selected files
    let totalSize = 0;
    files.forEach(f => (totalSize += f.size));

    // Check if total size exceeds the maximum allowed size (in MB)
    if (totalSize > this.maxUploadSizeInMb * 1024 * 1024) {
      alert('The total size of the file(s) being uploaded is too large. Upload aborted.');
      return; // Abort the upload if size is too large
    }

    // Set the uploading flag to true to indicate upload is in progress
    this.isUploading.set(true);

    // Call the application service to upload the documents and share the observable
    const upload$ = this.applicationService.uploadDocuments(this.applicationId(), this.documentType(), files, 'events', true).pipe(share()); // share() allows multiple subscribers to share the same observable execution

    // Use Angular's injection context to run reactive logic
    runInInjectionContext(this.injector, () => {
      // Create a stream that filters upload progress events
      const progress$ = upload$.pipe(
        filter((event): event is HttpUploadProgressEvent => event.type === HttpEventType.UploadProgress),
        map(event => {
          // If total size is available, compute and return upload percentage
          if (event.total) {
            return Math.round((event.loaded / event.total) * 100);
          }
          return 0;
        }),
      );

      // Convert the progress observable into a signal for reactive updates
      const uploadProgressSignal = toSignal(progress$, { initialValue: 0 });

      // Watch the progress signal and update the component's uploadProgress state
      effect(() => {
        this.uploadProgress.set(uploadProgressSignal());
      });

      // Create a stream that filters for the final HTTP response (upload complete)
      const response$ = upload$.pipe(
        filter(event => event.type === HttpEventType.Response),
        map(event => event.body), // Extract the response body (assumed to be document IDs)
        catchError(err => {
          // Handle errors: set uploading to false, log the error, and alert the user
          this.isUploading.set(false);
          console.error('Upload failed:', err);
          alert('Upload failed. Please try again later');
          return of(null); // Return a null observable to allow continued stream processing
        }),
      );

      // Convert the response observable to a signal
      const uploadResponseSignal = toSignal(response$, { initialValue: null });

      // Watch the response signal and update the state when the upload is complete
      effect(() => {
        const response = uploadResponseSignal();
        if (response) {
          // Upload successful: update documentIds and mark uploading as false
          this.isUploading.set(false);
          this.documentIds.set([...response]); // Store uploaded document IDs
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
