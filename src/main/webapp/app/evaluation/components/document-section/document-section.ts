import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import { DocumentViewerComponent } from '../../../shared/components/atoms/document-viewer/document-viewer.component';
import { SubSection } from '../sub-section/sub-section';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { ApplicationDocumentIdsDTO } from '../../../generated/model/applicationDocumentIdsDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';
import { ApplicationEvaluationResourceApiService } from '../../../generated/api/applicationEvaluationResourceApi.service';
import { DocumentDialog } from '../document-dialog/document-dialog';

export interface DocumentHolder {
  label: string;
  document: DocumentInformationHolderDTO;
}

@Component({
  selector: 'jhi-document-section',
  imports: [DocumentViewerComponent, SubSection, FontAwesomeModule, ButtonComponent, TranslateDirective, TooltipModule, DocumentDialog],
  templateUrl: './document-section.html',
})
export class DocumentSection {
  idsDTO = input<ApplicationDocumentIdsDTO | undefined>(undefined);
  applicationId = input.required<string | undefined>();

  documents = signal<DocumentHolder[]>([]);
  extraDocuments = signal<DocumentHolder[]>([]);

  allDocuments = computed(() => [...this.documents(), ...this.extraDocuments()]);

  dialogVisible = model<boolean>(false);

  documentsCount = signal<number>(0);

  readonly NUMBER_OF_DOCUMENTS = 3;

  evaluationResourceService = inject(ApplicationEvaluationResourceApiService);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });

  hasDocuments = computed(() => this.documents().length > 0);

  allDocumentsTooltip = computed(() => {
    this.currentLang();

    return this.extraDocuments()
      .map(doc => this.translate.instant(doc.label))
      .join(', ');
  });

  idChangeEffect = effect(() => {
    const dto = this.idsDTO();

    if (!dto) {
      this.documents.set([]);
      this.extraDocuments.set([]);
      this.documentsCount.set(0);
      return;
    }

    const result: { label: string; document: DocumentInformationHolderDTO }[] = [];

    dto.masterDocumentDictionaryIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeMaster', document: d }));

    if (dto.cvDocumentDictionaryId) {
      result.push({ label: 'evaluation.details.documentTypeCV', document: dto.cvDocumentDictionaryId });
    }

    dto.bachelorDocumentDictionaryIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeBachelor', document: d }));

    dto.referenceDocumentDictionaryIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeReference', document: d }));

    this.documentsCount.set(result.length);

    // Split into "shown" and "extra"
    this.documents.set(result.slice(0, this.NUMBER_OF_DOCUMENTS));
    this.extraDocuments.set(result.slice(this.NUMBER_OF_DOCUMENTS));
  });

  async downloadAllDocuments(): Promise<void> {
    const applicationId = this.applicationId();
    if (applicationId === undefined) {
      this.toastService.showError({ summary: 'Error', detail: 'No application selected' });
      return;
    }

    try {
      const response: HttpResponse<Blob> = await firstValueFrom(
        this.evaluationResourceService.downloadAll(applicationId, 'response', false, {
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
