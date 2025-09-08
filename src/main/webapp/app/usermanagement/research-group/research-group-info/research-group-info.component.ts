import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupManagementService } from 'app/generated/api/researchGroupManagement.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { TranslateDirective } from 'app/shared/language';

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
  imports: [CommonModule, StringInputComponent, ButtonComponent, EditorComponent, TranslateModule, TranslateDirective, ReactiveFormsModule],
  templateUrl: './research-group-info.component.html',
  styleUrl: './research-group-info.component.scss',
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

  // Computed properties
  researchGroupId = computed(() => this.currentUser()?.researchGroup?.researchGroupId);

  // Reactive forms
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    abbreviation: new FormControl(''),
    head: new FormControl('', [Validators.required]),
    school: new FormControl(''),
    website: new FormControl(''),
    email: new FormControl(''),
    city: new FormControl(''),
    postalCode: new FormControl(''),
    address: new FormControl(''),
    description: new FormControl(''),
    defaultFieldOfStudies: new FormControl(''),
  });

  // Services
  private accountService = inject(AccountService);
  private researchGroupService = inject(ResearchGroupManagementService);
  private toastService = inject(ToastService);

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
        summary: 'Error',
        detail: 'No research group ID available for saving.',
      });
      return;
    }

    try {
      this.isSaving.set(true);

      const formValue = this.form.value;
      const updateData: ResearchGroupDTO = {
        name: formValue.name!,
        abbreviation: formValue.abbreviation!,
        head: formValue.head!,
        email: formValue.email!,
        website: formValue.website!,
        school: formValue.school!,
        description: formValue.description!,
        street: formValue.address!,
        postalCode: formValue.postalCode!,
        city: formValue.city!,
        defaultFieldOfStudies: formValue.defaultFieldOfStudies!,
      };

      await firstValueFrom(this.researchGroupService.updateResearchGroup(researchGroupId, updateData));

      this.toastService.showSuccess({
        detail: 'Research group information updated successfully.',
      });
    } catch {
      this.toastService.showError({
        detail: 'Failed to save research group information.',
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
    } catch {
      this.toastService.showError({
        summary: 'Error Loading Data',
        detail: 'Failed to load research group information.',
      });
    } finally {
      this.hasInitialized.set(true);
    }
  }

  /**
   * Populates the form data with the given research group data.
   */
  private populateFormData(data?: ResearchGroupDTO): void {
    this.form.patchValue({
      name: data?.name ?? '',
      abbreviation: data?.abbreviation ?? '',
      head: data?.head ?? '',
      email: data?.email ?? '',
      website: data?.website ?? '',
      school: data?.school ?? '',
      city: data?.city ?? '',
      postalCode: data?.postalCode ?? '',
      address: data?.street ?? '',
      description: data?.description ?? '',
      defaultFieldOfStudies: data?.defaultFieldOfStudies ?? '',
    });
    this.form.updateValueAndValidity();
  }
}
