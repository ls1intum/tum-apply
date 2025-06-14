import { Component, effect, inject, input, signal } from '@angular/core';
import { DocumentResourceService } from 'app/generated';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'jhi-document-viewer',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  standalone: true,
})
export class DocumentViewerComponent {
  private documentService = inject(DocumentResourceService);
  documentDictionaryId = input.required<string>();

  pdfSrc = signal<Blob | null>(null);

  constructor() {
    effect(() => {
      this.documentService.downloadDocument(this.documentDictionaryId()).subscribe(
        blob => {
          this.pdfSrc.set(blob);
        },
        error => {
          console.error(error);
        },
      );
    });
  }
}
