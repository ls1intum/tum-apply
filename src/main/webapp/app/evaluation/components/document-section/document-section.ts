import { Component, effect, inject, input, signal } from '@angular/core';
import { DocumentInformationHolderDTO, DocumentResourceService } from 'app/generated';
import { DomSanitizer } from '@angular/platform-browser';

import { ApplicationDocumentIdsDTO } from '../../../generated';
import { DocumentViewerComponent } from '../../../shared/components/atoms/document-viewer/document-viewer.component';
import { SubSection } from '../sub-section/sub-section';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-document-section',
  imports: [DocumentViewerComponent, SubSection, ButtonComponent],
  templateUrl: './document-section.html',
  styleUrl: './document-section.scss',
})
export class DocumentSection {
  idsDTO = input<ApplicationDocumentIdsDTO | undefined>(undefined);

  documents = signal<{ label: string; id: DocumentInformationHolderDTO }[]>([]);

  readonly NUMBER_OF_DOCUMENTS = 3;

  documentService = inject(DocumentResourceService);
  sanitizer = inject(DomSanitizer);

  idChangeEffect = effect(() => {
    const dto = this.idsDTO();

    if (!dto) {
      this.documents.set([]);
      return;
    }
    const result: { label: string; id: DocumentInformationHolderDTO }[] = [];

    dto.masterDocumentDictionaryIds?.forEach(
      d => result.push({ label: 'Master Transcript', id: d }), // adapt "id" property name if different
    );

    if (dto.cvDocumentDictionaryId) {
      result.push({ label: 'CV', id: dto.cvDocumentDictionaryId });
    }

    dto.bachelorDocumentDictionaryIds?.forEach(d => result.push({ label: 'Bachelor Transcript', id: d }));

    dto.referenceDocumentDictionaryIds?.forEach(d => result.push({ label: 'Reference', id: d }));

    // Limit to first NUMBER_OF_DOCUMENTS
    this.documents.set(result.slice(0, this.NUMBER_OF_DOCUMENTS));
  });

  private loadDocument(): void {
    try {
      // TODO
    } catch {
      // TODO show toast
    }
  }
}
