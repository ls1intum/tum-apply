import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupDTO } from 'app/generated/model/research-group-dto';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { TranslateDirective } from 'app/shared/language';
import { ResearchGroupResourceApi, getResearchGroupResource } from 'app/generated/api/research-group-resource-api';
import { getDepartmentByIdResource } from 'app/generated/api/department-resource-api';
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
  // State signals
  isSaving = signal<boolean>(false);
  hasInitialized = computed<boolean>(() => !this.researchGroupResource.isLoading());

  // Computed properties
  researchGroupId = computed(() => this.currentUser()?.researchGroup?.researchGroupId);

  // httpResource for research group - auto-fetches when researchGroupId changes
  private readonly researchGroupIdForResource = computed(() => this.researchGroupId() ?? '');
  private readonly researchGroupResource = getResearchGroupResource(this.researchGroupIdForResource);

  // httpResource for department info - auto-fetches when departmentId changes
  private readonly departmentIdFromResearchGroup = computed(() => this.researchGroupResource.value()?.departmentId ?? '');
  private readonly departmentResource = getDepartmentByIdResource(this.departmentIdFromResearchGroup);

  departmentName = computed<string | null>(() => this.departmentResource.value()?.name ?? null);
  schoolName = computed<string | null>(() => this.departmentResource.value()?.school?.name ?? null);

  // Effect to populate form when research group data arrives
  private readonly initEffect = effect(() => {
    const researchGroup = this.researchGroupResource.value();
    if (researchGroup != null) {
      this.populateFormData(researchGroup);
    }
  });

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
  });

  // Services
  private accountService = inject(AccountService);
  private researchGroupApi = inject(ResearchGroupResourceApi);
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
      };

      await firstValueFrom(this.researchGroupApi.updateResearchGroup(researchGroupId, updateData));

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
    });
    this.form.updateValueAndValidity();
  }
}
