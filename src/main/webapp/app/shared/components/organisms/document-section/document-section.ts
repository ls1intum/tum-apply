import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import { DocumentViewerComponent } from '../../atoms/document-viewer/document-viewer.component';
import { SubSection } from '../../atoms/sub-section/sub-section';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { ToastService } from '../../../../service/toast-service';
import { ApplicationDocumentIdsDTO } from '../../../../generated/model/application-document-ids-dto';
import { DocumentInformationHolderDTO } from '../../../../generated/model/document-information-holder-dto';
import { ReferenceRequestDTO } from '../../../../generated/model/reference-request-dto';
import { ApplicationEvaluationResourceApi } from '../../../../generated/api/application-evaluation-resource-api';
import { DocumentDialog } from '../../molecules/document-dialog/document-dialog';

export interface DocumentHolder {
  /** Translation key for the row title — never a pre-translated string. */
  label: string;
  /** Optional placeholder values interpolated into the translation (e.g. {@code name}). */
  labelParams?: Record<string, unknown>;
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
  /**
   * External reference letters uploaded by referees, to be merged into the listed documents.
   * Each entry shows up labelled "Reference Letter — &lt;referee name&gt;".
   */
  referenceLetters = input<ReferenceRequestDTO[]>([]);

  documents = signal<DocumentHolder[]>([]);
  extraDocuments = signal<DocumentHolder[]>([]);

  allDocuments = computed(() => [...this.documents(), ...this.extraDocuments()]);

  dialogVisible = model<boolean>(false);

  documentsCount = signal<number>(0);

  readonly NUMBER_OF_DOCUMENTS = 3;

  evaluationApi = inject(ApplicationEvaluationResourceApi);
  toastService = inject(ToastService);
  translate = inject(TranslateService);

  currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });

  hasDocuments = computed(() => this.documents().length > 0);

  allDocumentsTooltip = computed(() => {
    this.currentLang();

    return this.extraDocuments()
      .map(doc => this.translate.instant(doc.label, doc.labelParams))
      .join(', ');
  });

  idChangeEffect = effect(() => {
    const dto = this.idsDTO();
    const letters = this.referenceLetters();

    if (!dto && letters.length === 0) {
      this.documents.set([]);
      this.extraDocuments.set([]);
      this.documentsCount.set(0);
      return;
    }

    const result: DocumentHolder[] = [];

    dto?.masterDocumentIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeMaster', document: d }));

    if (dto?.cvDocumentId) {
      result.push({ label: 'evaluation.details.documentTypeCV', document: dto.cvDocumentId });
    }

    dto?.bachelorDocumentIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeBachelor', document: d }));

    dto?.referenceDocumentIds?.forEach(d => result.push({ label: 'evaluation.details.documentTypeReference', document: d }));

    // Externally-uploaded reference letters appear last and are individually labelled with the
    // referee's name so reviewers can tell them apart at a glance. The label stays a translation
    // key — the referee name is interpolated as a parameter so it never round-trips through the
    // missing-translation handler.
    letters
      .filter(letter => !!letter.documentId)
      .forEach(letter => {
        const refereeName = [letter.title, letter.firstName, letter.lastName].filter(part => !!part).join(' ');
        result.push({
          label: 'evaluation.details.documentTypeReferenceLetter',
          labelParams: { name: refereeName },
          document: { id: letter.documentId!, name: refereeName, size: 0 },
        });
      });

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
      const response: HttpResponse<Blob> = await firstValueFrom(this.evaluationApi.downloadAll(applicationId));

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
