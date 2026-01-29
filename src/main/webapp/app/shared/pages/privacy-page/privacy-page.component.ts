import { Component, DestroyRef, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'app/service/toast-service';
import { UserDataExportResourceApiService } from 'app/generated/api/api';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DataExportStatusDTO } from 'app/generated/model/models';

import TranslateDirective from '../../language/translate.directive';

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
    () => this.currentExportStatus() === DataExportStatusDTO.StatusEnum.InCreation || this.cooldownSeconds() > 0,
  );

  readonly tooltip = computed(() => {
    this.currentLang(); // re-run when language changes to update translation
    if (!this.exportButtonDisabled()) return undefined;

    if (this.currentExportStatus() === DataExportStatusDTO.StatusEnum.InCreation) {
      return this.translateService.instant('privacy.export.tooltip.inCreation');
    } else if (this.cooldownSeconds() > 0) {
      const days = Math.ceil(this.cooldownSeconds() / (24 * 60 * 60));
      return this.translateService.instant('privacy.export.tooltip.cooldown', { days: days.toString() });
    }
  });

  protected readonly userDataExportService = inject(UserDataExportResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentLang = signal<string>(this.translateService.getCurrentLang());
  private readonly currentExportStatus = signal<DataExportStatusDTO.StatusEnum | null | undefined>(null);
  private readonly cooldownSeconds = signal<number>(0);

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

    this.currentExportStatus.set(DataExportStatusDTO.StatusEnum.InCreation);

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
    try {
      const status = await firstValueFrom(this.userDataExportService.getDataExportStatus());
      this.currentExportStatus.set(status.status);
      this.cooldownSeconds.set(status.cooldownSeconds ?? 0);
    } catch {
      // ignore status fetch errors
    }
  }
}
