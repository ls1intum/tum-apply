import { Component, ViewEncapsulation, computed, effect, input, model, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { DropdownComponent, DropdownOption } from '../../atoms/dropdown/dropdown.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { EditorComponent } from '../../atoms/editor/editor.component';

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
  applicantName = input<string | undefined>(undefined);
  jobName = input<string | undefined>(undefined);
  mode = input.required<'ACCEPT' | 'REJECT'>();
  visible = model<boolean>(false);

  notifyApplicant = model<boolean>(true);
  closeJob = model<boolean>(false);
  message = model<string | undefined>(undefined);

  selectedRejectReason = signal<DropdownOption | undefined>(undefined);

  accept = output();
  reject = output();

  canAccept = computed(() => {
    return (this.notifyApplicant() && this.message() !== undefined && this.message() !== '') || !this.notifyApplicant();
  });

  canReject = computed(() => {
    return this.selectedRejectReason() !== undefined;
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
      }
    });
  }

  onMessageChange(text: string): void {
    this.message.set(text);
  }

  resetDialogState(): void {
    this.message.set(undefined);
    this.notifyApplicant.set(true);
    this.closeJob.set(false);
    this.selectedRejectReason.set(undefined);
  }

  onSelectChange(option: DropdownOption): void {
    this.selectedRejectReason.set(option);
  }
}
