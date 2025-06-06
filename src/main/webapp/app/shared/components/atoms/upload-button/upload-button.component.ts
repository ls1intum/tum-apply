import { HttpEventType } from '@angular/common/http';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationResourceService } from 'app/generated';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'jhi-upload-button',
  imports: [FontAwesomeModule],
  templateUrl: './upload-button.component.html',
  styleUrl: './upload-button.component.scss',
  standalone: true,
})
export class UploadButtonComponent {
  uploadText = input<string>('Please upload');

  selectedFile = signal<File | undefined>(undefined);
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);
  uploadResponse = signal<any>(undefined); // Could also define a proper type

  applicationId = input<string>('d6c49666-2392-4184-ba12-2a0074b2d138'); // TODO

  valid = output<boolean>();

  applicationService = inject(ApplicationResourceService);
  // constructor(private fileUploadService: FileUploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]); //TODO
    }
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    const upload$ = this.applicationService.uploadDocuments(this.applicationId(), 'BACHELOR_TRANSCRIPT', [file]);

    // const uploadSignal = toSignal(upload$, {
    //   initialValue: { type: 'start' },
    // });

    // effect(() => {
    //   const event: any = uploadSignal();

    //   if (event.type === HttpEventType.UploadProgress && event.total) {
    //     const progress = Math.round((100 * event.loaded) / event.total);
    //     this.uploadProgress.set(progress);
    //   }

    //   if (event.type === HttpEventType.Response) {
    //     this.uploadResponse.set(event.body);
    //     this.isUploading.set(false);
    //   }
    // });
  }

  // upload(file: File): Observable<HttpEvent<any>> {
  //   const formData = new FormData();
  //   formData.append('file', file);

  //   const req = new HttpRequest('POST', this.uploadUrl, formData, {
  //     reportProgress: true,
  //   });

  //   return this.http.request(req);
  // }
}
