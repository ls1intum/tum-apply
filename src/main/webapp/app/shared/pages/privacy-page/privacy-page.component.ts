import { Component, ViewEncapsulation, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  protected readonly userDataExportService = inject(UserDataExportResourceApiService);
  private readonly toastService = inject(ToastService);

  private currentExportStatus: DataExportStatusDTO.StatusEnum | null | undefined = null;

  /**
   * Trigger user data export. Implementation mirrors the download approach used in
   * ApplicationDetailForApplicantComponent: read Content-Disposition header, extract
   * filename, create object URL for the blob, call `a.click()` and revoke the URL.
   */
  async exportUserData(): Promise<void> {
    try {
      await this.requestDataExport();
      this.currentExportStatus = DataExportStatusDTO.StatusEnum.InCreation;
    } catch {
      this.toastService.showErrorKey('privacy.export.requestFailed');
    }
  }

  exportButtonDisabled(): boolean {
    return this.currentExportStatus === DataExportStatusDTO.StatusEnum.InCreation;
  }

  private async requestDataExport(): Promise<void> {
    try {
      await firstValueFrom(this.userDataExportService.requestDataExport());
      this.toastService.showInfoKey('privacy.export.requested');
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  private handleRequestError(error: any): void {
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
