import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-research-group-detail-view.component',
  imports: [TranslateModule, StringInputComponent, ButtonComponent, ReactiveFormsModule, DividerModule, EditorComponent, InfoBoxComponent],
  templateUrl: './research-group-detail-view.component.html',
})
export class ResearchGroupDetailViewComponent implements OnInit {
  form = new FormGroup({
    abbreviation: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    school: new FormControl(''),
    defaultFieldOfStudies: new FormControl(''),
    head: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.email, Validators.pattern(/.+\..{2,}$/)]),
    website: new FormControl(''),
    description: new FormControl(''),
    city: new FormControl(''),
    postalCode: new FormControl(''),
    street: new FormControl(''),
  });

  researchGroupId = computed(() => this.config.data?.researchGroupId as string | undefined);

  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  readonly ResearchGroupService = inject(ResearchGroupResourceApiService);
  private readonly config = inject(DynamicDialogConfig);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    void this.init();
  }

  async onSave(): Promise<void> {
    if (!this.form.valid) {
      return;
    }

    const researchGroupId = this.researchGroupId();
    if (researchGroupId == null || researchGroupId.trim() === '') {
      this.toastService.showErrorKey('researchGroup.detailView.errors.noId');
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
        school: formValue.school ?? '',
        description: formValue.description ?? '',
        street: formValue.street ?? '',
        postalCode: formValue.postalCode ?? '',
        city: formValue.city ?? '',
        defaultFieldOfStudies: formValue.defaultFieldOfStudies ?? '',
      };

      await firstValueFrom(this.ResearchGroupService.updateResearchGroup(researchGroupId, updateData));

      this.toastService.showSuccessKey('researchGroup.detailView.success.updated');
    } catch {
      this.toastService.showErrorKey('researchGroup.detailView.errors.save');
    } finally {
      this.isSaving.set(false);
    }
  }

  private async init(): Promise<void> {
    const researchGroupId = this.researchGroupId();
    if (researchGroupId == null || researchGroupId.trim() === '') {
      // No research group ID available, leave form empty
      this.isLoading.set(false);
      return;
    }

    try {
      const researchGroup = await firstValueFrom(this.ResearchGroupService.getResearchGroup(researchGroupId));
      this.populateFormData(researchGroup);
    } catch {
      this.toastService.showErrorKey('researchGroup.detailView.errors.view');
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateFormData(data?: ResearchGroupDTO): void {
    this.form.patchValue({
      abbreviation: data?.abbreviation,
      name: data?.name,
      school: data?.school,
      defaultFieldOfStudies: data?.defaultFieldOfStudies,
      head: data?.head,
      email: data?.email,
      website: data?.website,
      description: data?.description,
      city: data?.city,
      postalCode: data?.postalCode,
      street: data?.street,
    });
    this.form.updateValueAndValidity();
  }
}
