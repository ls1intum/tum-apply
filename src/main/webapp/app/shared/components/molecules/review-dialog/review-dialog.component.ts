import { Component, ViewEncapsulation, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DropdownComponent, DropdownOption } from '../../atoms/dropdown/dropdown.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { EditorComponent } from '../../atoms/editor/editor.component';
import { ApplicationEvaluationDetailDTO } from '../../../../generated';

@Component({
  selector: 'jhi-review-dialog',
  imports: [
    CheckboxModule,
    DialogModule,
    FormsModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    TranslateModule,
    DropdownComponent,
    NgTemplateOutlet,
    ButtonComponent,
    EditorComponent,
  ],
  templateUrl: './review-dialog.component.html',
  styleUrl: './review-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ReviewDialogComponent {
  translate = inject(TranslateService);

  mode = input.required<'ACCEPT' | 'REJECT'>();
  visible = model<boolean>(false);

  application = input<ApplicationEvaluationDetailDTO | undefined>(undefined);

  notifyApplicant = model<boolean>(true);
  closeJob = model<boolean>(false);

  editorModel = signal<string>('');

  selectedRejectReason = signal<DropdownOption | undefined>(undefined);

  accept = output();
  reject = output();

  canAccept = computed(() => {
    return (this.notifyApplicant() && this.editorModel().length > 7) || !this.notifyApplicant();
  });

  canReject = computed(() => {
    return this.selectedRejectReason() !== undefined;
  });

  translationMetaData = computed(() => {
    const application = this.application();

    if (application) {
      return {
        APPLICANT_FIRST_NAME: application.applicationDetailDTO.applicant?.user.name ?? '',
        PROFESSOR_EMAIL: application.professor?.email,
        JOB_NAME: application.applicationDetailDTO.jobTitle,
        PROFESSOR_FIRST_NAME: application.professor?.firstName,
        PROFESSOR_LAST_NAME: application.professor?.lastName,
        RESEARCH_GROUP_NAME: application.professor?.researchGroupName,
      };
    }
    return undefined;
  });

  rejectReasons: DropdownOption[] = [
    {
      name: 'Job already filled',
      value: 'JOB_FILLED',
    },
    {
      name: 'Job outdated',
      value: 'JOB_OUTDATED',
    },
    {
      name: 'Failed requirements',
      value: 'FAILED_REQUIREMENTS',
    },
    {
      name: 'Other reason',
      value: 'OTHER_REASON',
    },
  ];

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.resetDialogState();
        this.editorModel.set(this.translate.instant('evaluation.defaultRejectMessage', this.translationMetaData()));
      }
    });
  }

  resetDialogState(): void {
    this.notifyApplicant.set(true);
    this.closeJob.set(false);
    this.selectedRejectReason.set(undefined);
  }

  onSelectChange(option: DropdownOption): void {
    this.selectedRejectReason.set(option);
  }

  onAccept(): void {
    console.warn(this.editorModel());
  }
}
