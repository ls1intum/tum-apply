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
import { AcceptDTO, ApplicationEvaluationDetailDTO, RejectDTO } from '../../../../generated';
import TranslateDirective from '../../../language/translate.directive';

import ReasonEnum = RejectDTO.ReasonEnum;

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
    TranslateDirective,
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

  accept = output<AcceptDTO>();
  reject = output<RejectDTO>();

  canAccept = computed(() => {
    // 7 chars are an empty HTML tag (e.g. '<p></p>)
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
        RESEARCH_GROUP_WEBSITE: application.professor?.researchGroupWebsite,
      };
    }
    return undefined;
  });

  // TODO adapt to translation keys when dropdown is adjusted
  rejectReasons: DropdownOption[] = [
    {
      name: 'evaluation.rejectReasons.jobFilled',
      value: 'JOB_FILLED',
    },
    {
      name: 'evaluation.rejectReasons.jobOutdated',
      value: 'JOB_OUTDATED',
    },
    {
      name: 'evaluation.rejectReasons.failedRequirements',
      value: 'FAILED_REQUIREMENTS',
    },
    {
      name: 'evaluation.rejectReasons.otherReason',
      value: 'OTHER_REASON',
    },
  ];

  constructor() {
    // Reset state each time the dialog opens
    effect(() => {
      if (this.visible()) {
        this.resetDialogState();
        this.editorModel.set(this.translate.instant('evaluation.defaultAcceptMessage', this.translationMetaData()));
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
    this.accept.emit({
      message: this.editorModel(),
      notifyApplicant: this.notifyApplicant(),
      closeJob: this.closeJob(),
    });
  }

  onReject(): void {
    const reason = this.selectedRejectReason();
    if (!reason) {
      return;
    }

    this.reject.emit({
      reason: this.getRejectReason(reason),
      notifyApplicant: this.notifyApplicant(),
    });
  }

  getRejectReason(option: DropdownOption): ReasonEnum {
    return option.value as ReasonEnum;
  }
}
