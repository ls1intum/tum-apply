import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Component, computed, input, model, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DocumentDictionaryDocumentTypeEnum } from 'app/generated/model/document-dictionary';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';

import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { UploadButtonComponent } from '../../atoms/upload-button/upload-button.component';

type DegreeType = 'bachelor' | 'master';

@Component({
  selector: 'jhi-degree-document-section',
  standalone: true,
  imports: [
    DividerModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    StringInputComponent,
    TooltipModule,
    TranslateModule,
    UploadButtonComponent,
  ],
  templateUrl: './degree-document-section.component.html',
})
export class DegreeDocumentSectionComponent {
  degreeType = input.required<DegreeType>();
  sectionTitleKey = input.required<string>();
  applicationId = input<string | undefined>(undefined);
  documentIds = model<DocumentInformationHolderDTO[] | undefined>(undefined);
  deferUpload = input<boolean>(false);
  required = input<boolean>(false);
  degreeNameControl = input<AbstractControl | undefined>(undefined);
  degreeUniversityControl = input<AbstractControl | undefined>(undefined);
  gradeControl = input<AbstractControl | undefined>(undefined);
  gradeHelperText = input<string>('');
  gradeWarningText = input<string>('');
  queuedFilesChange = output<File[]>();
  changeScale = output();

  readonly certificateLabelKey = computed(() => `entity.applicationPage2.label.${this.degreeType()}Certificate`);
  readonly degreeNameLabelKey = computed(() => `entity.applicationPage2.label.${this.degreeType()}DegreeName`);
  readonly degreeUniversityLabelKey = computed(() => `entity.applicationPage2.label.${this.degreeType()}DegreeUniversity`);
  readonly gradeLabelKey = computed(() => `entity.applicationPage2.label.${this.degreeType()}Grade`);
  readonly gradeTooltipKey = computed(() => `entity.applicationPage2.tooltip.${this.degreeType()}Grade`);
  readonly documentType = computed(() =>
    this.degreeType() === 'bachelor'
      ? DocumentDictionaryDocumentTypeEnum.BachelorTranscript
      : DocumentDictionaryDocumentTypeEnum.MasterTranscript,
  );
}
