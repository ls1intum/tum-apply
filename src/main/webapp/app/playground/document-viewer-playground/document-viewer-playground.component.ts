import { Component } from '@angular/core';
import { DocumentViewerComponent } from 'app/shared/components/atoms/document-viewer/document-viewer.component';

@Component({
  selector: 'jhi-document-viewer-playground',
  imports: [DocumentViewerComponent],
  templateUrl: './document-viewer-playground.component.html',
  styleUrl: './document-viewer-playground.component.scss',
})
export class DocumentViewerPlaygroundComponent {}
