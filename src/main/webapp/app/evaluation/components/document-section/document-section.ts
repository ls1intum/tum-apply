import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ApplicationEvaluationResourceService, DocumentInformationHolderDTO } from 'app/generated';
import { firstValueFrom } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import { ApplicationDocumentIdsDTO } from '../../../generated';
import { DocumentViewerComponent } from '../../../shared/components/atoms/document-viewer/document-viewer.component';
import { SubSection } from '../sub-section/sub-section';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';

@Component({
  selector: 'jhi-document-section',
  imports: [DocumentViewerComponent, SubSection, ButtonComponent, TranslateDirective],
  templateUrl: './document-section.html',
  styleUrl: './document-section.scss',
})
export class DocumentSection {
  idsDTO = input<ApplicationDocumentIdsDTO | undefined>(undefined);
  applicationId = input.required<string>();

  documents = signal<{ label: string; id: DocumentInformationHolderDTO }[]>([]);
  documentsCount = signal<number>(0);

  readonly NUMBER_OF_DOCUMENTS = 3;

  evaluationResourceService = inject(ApplicationEvaluationResourceService);
  toastService = inject(ToastService);

  hasDocuments = computed(() => this.documents().length > 0);

  idChangeEffect = effect(() => {
    const dto = this.idsDTO();

    if (!dto) {
      this.documents.set([]);
      return;
    }
    const result: { label: string; id: DocumentInformationHolderDTO }[] = [];

    dto.masterDocumentDictionaryIds?.forEach(
      d => result.push({ label: 'evaluation.details.documentTypeMaster', id: d }), // adapt "id" property name if different
    );

    if (dto.cvDocumentDictionaryId) {
      result.push({ label: 'evaluation.details.documentTypeCV', id: dto.cvDocumentDictionaryId });
    }

    dto.bachelorDocumentDictionaryIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeBachelor', id: d }));

    dto.referenceDocumentDictionaryIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeReference', id: d }));

    this.documentsCount.set(result.length);

    // Limit to first NUMBER_OF_DOCUMENTS
    this.documents.set(result.slice(0, this.NUMBER_OF_DOCUMENTS));
  });

  async downloadAllDocuments(): Promise<void> {
    try {
      const response: HttpResponse<Blob> = await firstValueFrom(
        this.evaluationResourceService.downloadAll(this.applicationId(), 'response', false, {
          httpHeaderAccept: 'application/zip',
        }),
      );

      const blob = response.body;

      if (blob != null) {
        // Try to extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'documents.zip';
        if (contentDisposition != null) {
          const match = /filename="?([^"]+)"?/.exec(contentDisposition);
          if (match?.[1] != null) {
            filename = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to download documents' });
    }
  }
}
