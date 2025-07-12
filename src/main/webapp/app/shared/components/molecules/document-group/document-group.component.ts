import { Component, input } from '@angular/core';
import { DocumentViewerComponent } from '../../atoms/document-viewer/document-viewer.component';
import { ApplicationDocumentIdsDTO, DocumentInformationHolderDTO } from 'app/generated';
import { TranslateDirective } from 'app/shared/language';

/**
 * A UI component that displays a group of buttons arranged
 * vertically or horizontally based on the provided input data.
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
