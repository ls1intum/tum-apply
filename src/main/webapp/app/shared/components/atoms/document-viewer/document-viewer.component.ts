import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { downloadDocumentResource } from 'app/generated/api/document-resource-api';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
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

  private cache: DocumentCacheService = inject(DocumentCacheService);

  private docId = computed(() => this.documentDictionaryId().id);
  private documentResource = downloadDocumentResource(this.docId);

  constructor() {
    effect(() => {
      const docId = this.docId();
      const blob = this.documentResource.value();

      // check cache first
      const cached = this.cache.get(docId);
      if (cached !== undefined) {
        this.sanitizedBlobUrl.set(cached);
        return;
      }

      if (blob) {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const safeUrl = this.cache.set(docId, pdfBlob);
        this.sanitizedBlobUrl.set(safeUrl);
      } else if (this.documentResource.error()) {
        console.error('Document download failed:', this.documentResource.error());
        this.sanitizedBlobUrl.set(undefined);
      }
    });
  }
}
