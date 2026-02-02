import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { CommonModule } from '@angular/common';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { AccountService } from 'app/core/auth/account.service';
import { firstValueFrom } from 'rxjs';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';

import { StringInputComponent } from '../../components/atoms/string-input/string-input.component';
import { ButtonComponent } from '../../components/atoms/button/button.component';
import { UploadButtonComponent } from '../../components/atoms/upload-button/upload-button.component';

@Component({
  selector: 'jhi-settings-documents',
  standalone: true,
  imports: [
    CommonModule,
    DividerModule,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
    ButtonComponent,
    TooltipModule,
    FontAwesomeModule,
    UploadButtonComponent,
  ],
  templateUrl: './settings-documents.component.html',
})
export class SettingsDocumentsComponent {
  fb = inject(FormBuilder);

  form = this.fb.group({
    bachelorDegreeName: [''],
    bachelorDegreeUniversity: [''],
    bachelorGrade: [''],
    masterDegreeName: [''],
    masterDegreeUniversity: [''],
    masterGrade: [''],
  });

  // Document tracking for upload components
  bachelorDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  masterDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  cvDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  referenceDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);

  // Mock application ID for upload components (settings don't have application context)
  mockApplicationId = signal<string>('settings-mock-id');

  saving = signal(false);

  private applicationService = inject(ApplicationResourceApiService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);

  async saveAll(): Promise<void> {
    this.saving.set(true);
    try {
      // update applicant profile fields
      const loadedUser = this.accountService.loadedUser();
      if (!loadedUser?.id) {
        this.toastService.showErrorKey('settings.documents.save_failed');
        return;
      }

      const applicantDTO: ApplicantDTO = {
        user: { userId: loadedUser.id },
        bachelorDegreeName: this.form.get('bachelorDegreeName')?.value ?? undefined,
        bachelorUniversity: this.form.get('bachelorDegreeUniversity')?.value ?? undefined,
        bachelorGrade: this.form.get('bachelorGrade')?.value ?? undefined,
        masterDegreeName: this.form.get('masterDegreeName')?.value ?? undefined,
        masterUniversity: this.form.get('masterDegreeUniversity')?.value ?? undefined,
        masterGrade: this.form.get('masterGrade')?.value ?? undefined,
      };

      await firstValueFrom(this.applicationService.updateApplicantProfile(applicantDTO));

      this.toastService.showSuccessKey('settings.documents.saved_success');
    } catch (err) {
      console.error(err);
      this.toastService.showErrorKey('settings.documents.save_failed');
    } finally {
      this.saving.set(false);
    }
  }
}
