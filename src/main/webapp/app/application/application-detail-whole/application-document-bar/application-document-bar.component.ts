import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-application-document-bar',
  imports: [FontAwesomeModule, NgTemplateOutlet],
  templateUrl: './application-document-bar.component.html',
  styleUrl: './application-document-bar.component.scss',
})
export class ApplicationDocumentBarComponent {}
