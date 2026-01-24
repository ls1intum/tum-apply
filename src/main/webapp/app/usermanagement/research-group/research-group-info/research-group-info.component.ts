import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { TranslateDirective } from 'app/shared/language';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { DividerModule } from 'primeng/divider';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';

export interface ResearchGroupFormData {
  name: string;
  abbreviation: string;
  head: string;
  school: string;
  website: string;
  email: string;
  city: string;
  postalCode: string;
  address: string;
  description: string;
}

@Component({
  selector: 'jhi-research-group-info',
  imports: [
    StringInputComponent,
    ButtonComponent,
    EditorComponent,
    TranslateModule,
    TranslateDirective,
    ReactiveFormsModule,
    DividerModule,
    InfoBoxComponent,
  ],
  templateUrl: './research-group-info.component.html',
})
export class ResearchGroupInfoComponent {
  // Effect to initialize when user data becomes available
  initEffect = effect(() => {
    const currentUser = this.currentUser();
    if (currentUser && !this.hasInitialized()) {
      void this.init();
    }
  });

  // State signals
  isSaving = signal<boolean>(false);
  hasInitialized = signal<boolean>(false);
  departmentName = signal<string | null>(null);
  schoolName = signal<string | null>(null);

  // Computed properties
  researchGroupId = computed(() => this.currentUser()?.researchGroup?.researchGroupId);

  // Reactive forms
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    abbreviation: new FormControl(''),
    head: new FormControl('', [Validators.required]),
    website: new FormControl(''),
    email: new FormControl('', [Validators.email, Validators.pattern(/.+\..{2,}$/)]),
    city: new FormControl(''),
    postalCode: new FormControl(''),
    address: new FormControl(''),
    description: new FormControl(''),
    defaultFieldOfStudies: new FormControl(''),
  });

  // Services
  private accountService = inject(AccountService);
  private researchGroupService = inject(ResearchGroupResourceApiService);
  private departmentService = inject(DepartmentResourceApiService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  private readonly translationKey = 'researchGroup.groupInfo';

  private currentUser = this.accountService.loadedUser;
  /**
   * Saves the research group data to the API.
   */
  // TODO: Avoid saving everything every time the form is saved. Only save the fields that have changed.
  async onSave(): Promise<void> {
    if (!this.form.valid) {
      return;
    }

    const researchGroupId = this.researchGroupId();
    if (researchGroupId == null || researchGroupId.trim() === '') {
      this.toastService.showError({
        summary: this.translate.instant(`${this.translationKey}.toasts.saveFailed`),
        detail: this.translate.instant(`${this.translationKey}.toasts.noId`),
      });
      return;
    }

    try {
      this.isSaving.set(true);

      const formValue = this.form.value;
      const updateData: ResearchGroupDTO = {
        name: formValue.name ?? '',
        abbreviation: formValue.abbreviation ?? '',
        head: formValue.head ?? '',
        email: formValue.email ?? '',
        website: formValue.website ?? '',
        description: formValue.description ?? '',
        street: formValue.address ?? '',
        postalCode: formValue.postalCode ?? '',
        city: formValue.city ?? '',
        defaultFieldOfStudies: formValue.defaultFieldOfStudies ?? '',
      };

      await firstValueFrom(this.researchGroupService.updateResearchGroup(researchGroupId, updateData));

      this.toastService.showSuccess({
        detail: this.translate.instant(`${this.translationKey}.toasts.updated`),
      });
    } catch {
      this.toastService.showError({
        detail: this.translate.instant(`${this.translationKey}.toasts.saveFailed`),
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Initializes the form data by fetching the research group data from the API.
   */
  private async init(): Promise<void> {
    try {
      const researchGroupId = this.researchGroupId();

      if (researchGroupId == null || researchGroupId.trim() === '') {
        // No research group ID available, leave form empty
        return;
      }

      const researchGroup = await firstValueFrom(this.researchGroupService.getResearchGroup(researchGroupId));
      this.populateFormData(researchGroup);

      // Fetch department info if departmentId exists
      if (researchGroup.departmentId != null) {
        await this.loadDepartmentInfo(researchGroup.departmentId);
      }
    } catch {
      this.toastService.showError({
        summary: this.translate.instant(`${this.translationKey}.toasts.loadFailed`),
        detail: this.translate.instant(`${this.translationKey}.toasts.loadFailed`),
      });
    } finally {
      this.hasInitialized.set(true);
    }
  }

  /**
   * Loads department and school information from the API.
   */
  private async loadDepartmentInfo(departmentId: string): Promise<void> {
    try {
      const department = await firstValueFrom(this.departmentService.getDepartmentById(departmentId));
      this.departmentName.set(department.name ?? null);
      this.schoolName.set(department.school?.name ?? null);
    } catch {
      // Silently fail - the organization info is optional display-only data
      this.departmentName.set(null);
      this.schoolName.set(null);
    }
  }

  /**
   * Populates the form data with the given research group data.
   */
  private populateFormData(data?: ResearchGroupDTO): void {
    this.form.patchValue({
      name: data?.name,
      abbreviation: data?.abbreviation,
      head: data?.head,
      email: data?.email,
      website: data?.website,
      city: data?.city,
      postalCode: data?.postalCode,
      address: data?.street,
      description: data?.description,
      defaultFieldOfStudies: data?.defaultFieldOfStudies,
    });
    this.form.updateValueAndValidity();
  }
}
