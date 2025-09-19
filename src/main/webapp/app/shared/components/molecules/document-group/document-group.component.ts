import { Component, input } from '@angular/core';
import { TranslateDirective } from 'app/shared/language';

import { DocumentViewerComponent } from '../../atoms/document-viewer/document-viewer.component';
import { ApplicationDocumentIdsDTO } from '../../../../generated/model/applicationDocumentIdsDTO';

/**
 * A UI component that displays a group of document viewers arranged
 * vertically.
 */
@Component({
  selector: 'jhi-document-group',
  imports: [TranslateDirective, DocumentViewerComponent],
  templateUrl: './document-group.component.html',
  styleUrl: './document-group.component.scss',
  standalone: true,
})
export default class DocumentGroupComponent {
  documentIds = input.required<ApplicationDocumentIdsDTO>();
}
