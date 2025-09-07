import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupManagementService } from 'app/generated/api/researchGroupManagement.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';

export interface ResearchGroupFormData {
  name: string;
  abbreviation: string;
  groupHead: string;
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
  imports: [CommonModule, StringInputComponent, ButtonComponent, EditorComponent, TranslateModule, FontAwesomeModule],
  templateUrl: './research-group-info.component.html',
  styleUrl: './research-group-info.component.scss',
})
export class ResearchGroupInfoComponent {
  // State signals
  isSaving = signal<boolean>(false);
  hasInitialized = signal<boolean>(false);

  // Form data signal
  formData = signal<ResearchGroupFormData>({
    name: '',
    abbreviation: '',
    groupHead: '',
    school: '',
    website: '',
    email: '',
    city: '',
    postalCode: '',
    address: '',
    description: '',
  });

  // Computed properties
  currentUser = computed(() => this.accountService.loadedUser());
  researchGroupId = computed(() => this.currentUser()?.researchGroup?.researchGroupId);

  // Form validation computed
  isFormValid = computed(() => {
    const data = this.formData();
    return !!(data.name && data.abbreviation && data.groupHead && data.school && data.website && data.email);
  });

  // Separate form control for description since editor doesn't work with model binding
  descriptionControl = new FormControl('');

  // Services
  private accountService = inject(AccountService);
  private researchGroupService = inject(ResearchGroupManagementService);
  private toastService = inject(ToastService);

  constructor() {
    // Effect to initialize when user data becomes available
    effect(() => {
      const currentUser = this.currentUser();
      if (currentUser && !this.hasInitialized()) {
        void this.init();
      }
    });
  }

  /**
   * Saves the research group data to the API.
   */
  // TODO: Avoid saving everything every time the form is saved. Only save the fields that have changed.
  async onSave(): Promise<void> {
    if (!this.isFormValid()) {
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

      const data = this.formData();
      const updateData: ResearchGroupDTO = {
        name: data.name,
        abbreviation: data.abbreviation,
        head: data.groupHead,
        email: data.email,
        website: data.website,
        school: data.school,
        description: this.descriptionControl.value ?? '',
        defaultFieldOfStudies: undefined,
        street: data.address,
        postalCode: data.postalCode,
        city: data.city,
      };

      await firstValueFrom(this.researchGroupService.updateResearchGroup(researchGroupId, updateData));

      this.toastService.showSuccess({
        detail: 'Research group information updated successfully.',
      });
    } catch (error) {
      console.error('Error saving research group data:', error);
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
    } catch (error) {
      console.error('Error loading research group data:', error);
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
    const newFormData: ResearchGroupFormData = {
      name: data?.name ?? '',
      abbreviation: data?.abbreviation ?? '',
      groupHead: data?.head ?? '',
      email: data?.email ?? '',
      website: data?.website ?? '',
      school: data?.school ?? '',
      city: data?.city ?? '',
      postalCode: data?.postalCode ?? '',
      address: data?.street ?? '',
      description: data?.description ?? '',
    };

    this.formData.set(newFormData);
    this.descriptionControl.setValue(newFormData.description);
  }
}
