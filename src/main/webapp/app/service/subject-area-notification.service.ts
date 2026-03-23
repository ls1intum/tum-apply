import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApplicantResourceApiService } from 'app/generated/api/applicantResourceApi.service';
import { JobCardDTO } from 'app/generated/model/jobCardDTO';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root',
})
export class SubjectAreaNotificationService {
  readonly subscribedSubjectAreas = signal<Set<JobCardDTO.SubjectAreaEnum>>(new Set());

  private readonly applicantService = inject(ApplicantResourceApiService);
  private readonly accountService = inject(AccountService);
  private readonly toastService = inject(ToastService);

  async loadSubjectAreaSubscriptions(): Promise<void> {
    if (!this.canManageSubjectAreaSubscriptions()) {
      this.subscribedSubjectAreas.set(new Set());
      return;
    }

    try {
      const subscriptions = await firstValueFrom(this.applicantService.getSubjectAreaSubscriptions());
      this.subscribedSubjectAreas.set(new Set(subscriptions.map(subscription => subscription.subjectArea as JobCardDTO.SubjectAreaEnum)));
    } catch {
      this.subscribedSubjectAreas.set(new Set());
      this.toastService.showErrorKey('jobOverviewPage.errors.loadSubjectAreaSubscriptions');
    }
  }

  isSubjectAreaSubscribed(subjectArea: JobCardDTO.SubjectAreaEnum | undefined): boolean {
    return subjectArea !== undefined && this.subscribedSubjectAreas().has(subjectArea);
  }

  async toggleSubjectAreaNotification(subjectArea: JobCardDTO.SubjectAreaEnum): Promise<void> {
    if (!this.canManageSubjectAreaSubscriptions()) {
      return;
    }

    try {
      if (this.isSubjectAreaSubscribed(subjectArea)) {
        await firstValueFrom(this.applicantService.removeSubjectAreaSubscription(subjectArea));
        this.removeSubscribedSubjectArea(subjectArea);
        this.toastService.showSuccessKey('jobOverviewPage.subjectAreaNotifications.deactivated');
      } else {
        await firstValueFrom(this.applicantService.addSubjectAreaSubscription(subjectArea));
        this.addSubscribedSubjectArea(subjectArea);
        this.toastService.showSuccessKey('jobOverviewPage.subjectAreaNotifications.activated');
      }
    } catch {
      this.toastService.showErrorKey('jobOverviewPage.subjectAreaNotifications.error');
    }
  }

  canManageSubjectAreaSubscriptions(): boolean {
    return this.accountService.signedIn() && this.accountService.hasAnyAuthority([UserShortDTO.RolesEnum.Applicant]);
  }

  private addSubscribedSubjectArea(subjectArea: JobCardDTO.SubjectAreaEnum): void {
    this.subscribedSubjectAreas.update(current => new Set(current).add(subjectArea));
  }

  private removeSubscribedSubjectArea(subjectArea: JobCardDTO.SubjectAreaEnum): void {
    this.subscribedSubjectAreas.update(current => {
      const next = new Set(current);
      next.delete(subjectArea);
      return next;
    });
  }
}
