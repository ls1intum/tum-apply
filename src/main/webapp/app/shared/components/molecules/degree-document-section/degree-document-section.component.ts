import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Component, computed, input, model, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AiExtractionBoxComponent } from 'app/shared/components/molecules/ai-extraction-box/ai-extraction-box.component';
import {
  DocumentInformationHolderDTO,
  DocumentInformationHolderDTODocumentTypeEnum,
} from 'app/generated/model/document-information-holder-dto';

import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { UploadButtonComponent } from '../../atoms/upload-button/upload-button.component';

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
    AiExtractionBoxComponent,
  ],
  templateUrl: './degree-document-section.component.html',
})
export class DegreeDocumentSectionComponent {
  applicationId = input<string | undefined>(undefined);
  deferUpload = input<boolean>(false);
  required = input<boolean>(false);

  // Bachelor-specific bindings
  bachelorDocumentIds = model<DocumentInformationHolderDTO[] | undefined>(undefined);
  bachelorDegreeNameControl = input<AbstractControl | undefined>(undefined);
  bachelorDegreeUniversityControl = input<AbstractControl | undefined>(undefined);
  bachelorGradeControl = input<AbstractControl | undefined>(undefined);
  bachelorGradeHelperText = input<string>('');
  bachelorGradeWarningText = input<string>('');
  bachelorQueuedFilesChange = output<File[]>();
  bachelorChangeScale = output();

  // Master-specific bindings
  masterDocumentIds = model<DocumentInformationHolderDTO[] | undefined>(undefined);
  masterDegreeNameControl = input<AbstractControl | undefined>(undefined);
  masterDegreeUniversityControl = input<AbstractControl | undefined>(undefined);
  masterGradeControl = input<AbstractControl | undefined>(undefined);
  masterGradeHelperText = input<string>('');
  masterGradeWarningText = input<string>('');
  masterQueuedFilesChange = output<File[]>();
  masterChangeScale = output();
  // AI extraction integration
  aiFeaturesEnabled = input<boolean>(false);
  isExtractingAi = input<boolean>(false);
  extract = output<void>();

  readonly aiDisabled = computed(() => {
    const hasBachelor = (this.bachelorDocumentIds()?.length ?? 0) > 0;
    const hasMaster = (this.masterDocumentIds()?.length ?? 0) > 0;
    return !(hasBachelor || hasMaster);
  });

  readonly bachelorCertificateLabelKey = computed(() => `entity.applicationPage2.label.bachelorCertificate`);
  readonly masterCertificateLabelKey = computed(() => `entity.applicationPage2.label.masterCertificate`);
  readonly bachelorDegreeNameLabelKey = computed(() => `entity.applicationPage2.label.bachelorDegreeName`);
  readonly masterDegreeNameLabelKey = computed(() => `entity.applicationPage2.label.masterDegreeName`);
  readonly bachelorDegreeUniversityLabelKey = computed(() => `entity.applicationPage2.label.bachelorDegreeUniversity`);
  readonly masterDegreeUniversityLabelKey = computed(() => `entity.applicationPage2.label.masterDegreeUniversity`);
  readonly bachelorGradeLabelKey = computed(() => `entity.applicationPage2.label.bachelorGrade`);
  readonly masterGradeLabelKey = computed(() => `entity.applicationPage2.label.masterGrade`);
  readonly bachelorGradeTooltipKey = computed(() => `entity.applicationPage2.tooltip.bachelorGrade`);
  readonly masterGradeTooltipKey = computed(() => `entity.applicationPage2.tooltip.masterGrade`);
  readonly bachelorDocumentType = computed(() => DocumentInformationHolderDTODocumentTypeEnum.BachelorTranscript);
  readonly masterDocumentType = computed(() => DocumentInformationHolderDTODocumentTypeEnum.MasterTranscript);
}
