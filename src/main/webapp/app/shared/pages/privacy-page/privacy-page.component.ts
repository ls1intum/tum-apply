import { Component, DestroyRef, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'app/service/toast-service';
import { UserDataExportResourceApiService } from 'app/generated/api/api';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { AccountService } from 'app/core/auth/account.service';

import TranslateDirective from '../../language/translate.directive';

type ExportStatus = 'REQUESTED' | 'IN_CREATION' | 'EMAIL_SENT' | 'COMPLETED' | null;

@Component({
  selector: 'jhi-privacy-page',
  standalone: true,
  imports: [TranslateDirective, ButtonComponent],
  templateUrl: './privacy-page.component.html',
  styleUrl: './privacy-page.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PrivacyPageComponent {
  readonly exportButtonDisabled = computed(
    () => !this.signedIn() || this.currentExportStatus() === 'IN_CREATION' || this.cooldownSeconds() > 0,
  );

  readonly tooltip = computed(() => {
    this.currentLang(); // re-run when language changes to update translation
    if (!this.exportButtonDisabled()) return undefined;

    if (!this.signedIn()) {
      return this.translateService.instant('privacy.export.tooltip.notLoggedIn');
    } else if (this.currentExportStatus() === 'IN_CREATION') {
      return this.translateService.instant('privacy.export.tooltip.inCreation');
    } else if (this.cooldownSeconds() > 0) {
      const days = Math.ceil(this.cooldownSeconds() / (24 * 60 * 60));
      return this.translateService.instant('privacy.export.tooltip.cooldown', { days: days.toString() });
    }
  });

  readonly translateService = inject(TranslateService);
  readonly currentLang = signal<string>(this.translateService.getCurrentLang());
  readonly currentExportStatus = signal<ExportStatus>(null);
  readonly cooldownSeconds = signal<number>(0);
  readonly signedIn = computed(() => this.accountService.signedIn());

  protected readonly userDataExportService = inject(UserDataExportResourceApiService);
  private readonly accountService = inject(AccountService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    void this.refreshStatus();

    this.translateService.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => this.currentLang.set(event.lang));
  }

  /**
   * Trigger user data export. Implementation mirrors the download approach used in
   * ApplicationDetailForApplicantComponent: read Content-Disposition header, extract
   * filename, create object URL for the blob, call `a.click()` and revoke the URL.
   */
  async exportUserData(): Promise<void> {
    if (this.exportButtonDisabled()) {
      return;
    }

    this.currentExportStatus.set('IN_CREATION');

    try {
      await firstValueFrom(this.userDataExportService.requestDataExport());
      await this.refreshStatus();
      this.toastService.showInfoKey('privacy.export.requested');
    } catch (error) {
      this.currentExportStatus.set(null);
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 409:
            this.toastService.showErrorKey('privacy.export.requestFailed409');
            break;
          case 429:
            this.toastService.showErrorKey('privacy.export.requestFailed429');
            break;
          default:
            this.toastService.showErrorKey('privacy.export.requestFailed');
        }
      } else {
        this.toastService.showErrorKey('privacy.export.requestFailed');
      }
    }
  }

  private async refreshStatus(): Promise<void> {
    if (!this.accountService.signedIn()) {
      return;
    }
    try {
      const status = await firstValueFrom(this.userDataExportService.getDataExportStatus());
      this.currentExportStatus.set((status.status as ExportStatus) ?? null);
      this.cooldownSeconds.set(status.cooldownSeconds ?? 0);
    } catch {
      // ignore status fetch errors
    }
  }
}
