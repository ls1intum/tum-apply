import { Component, effect, inject, input, signal } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DocumentResourceApi } from 'app/generated/api/document-resource-api';
import { DocumentInformationHolderDTO } from 'app/generated/models/document-information-holder-dto';
import { DocumentCacheService } from 'app/service/document-cache.service';

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

  private documentService = inject(DocumentResourceApi);
  private cache: DocumentCacheService = inject(DocumentCacheService);

  constructor() {
    effect(() => {
      void this.initDocument();
    });
  }

  async initDocument(): Promise<void> {
    const docId = this.documentDictionaryId().id;

    // check cache first
    const cached = this.cache.get(docId);
    if (cached !== undefined) {
      this.sanitizedBlobUrl.set(cached);
      return;
    }

    try {
      const response = await firstValueFrom(this.documentService.downloadDocument(docId));
      const pdfBlob = response.body ?? new Blob([], { type: 'application/pdf' });
      const safeUrl = this.cache.set(docId, pdfBlob);
      this.sanitizedBlobUrl.set(safeUrl);
    } catch (error) {
      console.error('Document download failed:', error);
      this.sanitizedBlobUrl.set(undefined);
    }
  }
}
