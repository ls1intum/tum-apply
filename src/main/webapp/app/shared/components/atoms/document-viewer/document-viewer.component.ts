import { Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  sanitizedBlobUrl?: SafeResourceUrl;

  private documentService = inject(DocumentResourceService);

  constructor(private sanitizer: DomSanitizer) {
    effect(() => {
      this.initDocument();
    });
  }

  async initDocument(): Promise<void> {
    const response = await firstValueFrom(this.documentService.downloadDocument(this.documentDictionaryId()));
    const pdfBlob = new Blob([response], { type: 'application/pdf' });
    this.pdfSrc.set(pdfBlob);
    const blobUrl = URL.createObjectURL(pdfBlob);
    this.sanitizedBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#toolbar=0&navpanes=0');
  }
}
