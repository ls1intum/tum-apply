import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService } from 'app/core/auth/account.service';

import { JobCardListComponent } from '../job-card-list/job-card-list.component';
import TranslateDirective from '../../../shared/language/translate.directive';

@Component({
  selector: 'jhi-job-overview-page',
  standalone: true,
  imports: [CommonModule, JobCardListComponent, TranslateDirective],
  templateUrl: './job-overview-page.component.html',
  styleUrls: ['./job-overview-page.component.scss'],
})
export class JobOverviewPageComponent {
  router = inject(Router);
  accountService = inject(AccountService);

  private redirectEffect = effect(() => {
    const user = this.accountService.user();
    if (user && this.accountService.hasAnyAuthority(['PROFESSOR'])) {
      void this.router.navigate(['/professor']);
    }
  });
}
