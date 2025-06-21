import { Component, effect, inject, input, signal } from '@angular/core';
import { DocumentResourceService } from 'app/generated';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-document-viewer',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  standalone: true,
})
export class DocumentViewerComponent {
  documentDictionaryId = input.required<string>();

  pdfSrc = signal<Blob | null>(null);

  private documentService = inject(DocumentResourceService);

  constructor() {
    effect(() => {
      this.initDocument();
    });
  }

  async initDocument(): Promise<void> {
    const pdfSrc = await firstValueFrom(this.documentService.downloadDocument(this.documentDictionaryId()));
    this.pdfSrc.set(pdfSrc);
  }
}
