import { Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { DocumentResourceApiService } from '../../../../generated/api/documentResourceApi.service';
import { DocumentInformationHolderDTO } from '../../../../generated/model/documentInformationHolderDTO';

@Component({
  selector: 'jhi-document-viewer',
  imports: [],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  standalone: true,
})
export class DocumentViewerComponent {
  documentDictionaryId = input.required<DocumentInformationHolderDTO>();

  sanitizedBlobUrl = signal<SafeResourceUrl | undefined>(undefined);

  private documentService = inject(DocumentResourceApiService);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    effect(() => {
      this.initDocument();
    });
  }

  async initDocument(): Promise<void> {
    try {
      const response = await firstValueFrom(this.documentService.downloadDocument(this.documentDictionaryId().id));
      const pdfBlob = new Blob([response], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      this.sanitizedBlobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#toolbar=0&navpanes=0'));
    } catch (error) {
      console.error('Document download failed:', error);
      this.sanitizedBlobUrl.set(undefined);
    }
  }
}
