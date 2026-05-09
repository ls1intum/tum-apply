import { Component, input } from '@angular/core';
import { TranslateDirective } from 'app/shared/language';

import { DocumentViewerComponent } from '../../atoms/document-viewer/document-viewer.component';
import { ApplicationDocumentIdsDTO } from '../../../../generated/model/application-document-ids-dto';

/**
 * A UI component that displays a group of document viewers arranged
 * vertically.
 */
@Component({
  selector: 'jhi-document-group',
  imports: [TranslateDirective, DocumentViewerComponent],
  templateUrl: './document-group.component.html',
  standalone: true,
})
export default class DocumentGroupComponent {
  documentIds = input.required<ApplicationDocumentIdsDTO>();

  readonly documentSectionClass = 'mb-2 flex flex-col rounded-lg border border-border-default p-4';
  readonly documentViewerClass = 'mb-1 h-80 w-full rounded-lg border border-border-default';
}
