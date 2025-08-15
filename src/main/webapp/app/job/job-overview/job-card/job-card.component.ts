import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import dayjs from 'dayjs/esm';
import { TranslateService } from '@ngx-translate/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthCardComponent } from 'app/shared/components/organisms/auth-card/auth-card.component';
import { AccountService } from 'app/core/auth/account.service';

import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import SharedModule from '../../../shared/shared.module';

@Component({
  selector: 'jhi-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.scss'],
  standalone: true,
  providers: [DialogService],
  imports: [FontAwesomeModule, CardModule, ButtonComponent, CommonModule, SharedModule, TooltipModule],
})
export class JobCardComponent {
  jobId = input<string>('');
  jobTitle = input<string>('');
  fieldOfStudies = input<string>('');
  location = input<string>('');
  professor = input<string>('');
  workload = input<number | undefined>(undefined);
  startDate = input<string | undefined>('');
  relativeTime = input<string>('');
  // TO-DO: Replace value of headerColor with a color corresponding to the field of study
  headerColor = input<string>('var(--p-secondary-color)');
  // TO-DO: Replace value of icon with an icon corresponding to the field of study
  icon = input<string>('flask-vial');
  ref: DynamicDialogRef | undefined;

  readonly formattedStartDate = computed(() => (this.startDate() !== undefined ? dayjs(this.startDate()).format('DD.MM.YYYY') : undefined));
  translate = inject(TranslateService);

  private router = inject(Router);
  private dialogService = inject(DialogService);
  private accountService = inject(AccountService);

  onViewDetails(): void {
    this.router.navigate([`/job/detail/${this.jobId()}`]);
  }

  onApply(): void {
    if (this.accountService.signedIn()) {
      this.router.navigate([`/application/create/${this.jobId()}`]);
      return;
    }

    this.ref = this.dialogService.open(AuthCardComponent, {
      style: {
        border: 'none',
        overflow: 'auto',
        background: 'transparent',
        boxShadow: 'none',
      },
      data: { redirectUri: `/application/create/${this.jobId()}` },
      modal: true,
      contentStyle: { padding: '0' },
      dismissableMask: true,
      closeOnEscape: true,
      focusOnShow: true,
      showHeader: false,
    });
  }
}
