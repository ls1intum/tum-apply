import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, Observable, firstValueFrom } from 'rxjs';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import {
  ImageUploadButtonComponent,
  ImageUploadError,
} from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';
import { SelectComponent } from 'app/shared/components/atoms/select/select.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ImageDTO } from 'app/generated/model/image-dto';
import { ImageResourceApi, getDefaultJobBannersResource, GetDefaultJobBannersParams } from 'app/generated/api/image-resource-api';
import { getDepartmentsResource } from 'app/generated/api/department-resource-api';
import { DepartmentDTO } from 'app/generated/model/department-dto';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

interface DepartmentSelectOption {
  name: string;
  value: string | number;
}

@Component({
  selector: 'jhi-department-images',
  imports: [
    ButtonComponent,
    BackButtonComponent,
    TranslateDirective,
    TranslateModule,
    ConfirmDialog,
    InfoBoxComponent,
    ImageUploadButtonComponent,
    SelectComponent,
  ],
  templateUrl: './department-images.component.html',
})
export class DepartmentImages {
  readonly defaultImages = signal<ImageDTO[]>([]);
  readonly selectedDepartment = signal<DepartmentSelectOption | undefined>(undefined);

  // Departments resource
  private readonly departmentsResource = getDepartmentsResource();
  readonly departments = computed<DepartmentDTO[]>(() => this.departmentsResource.value() ?? []);

  readonly departmentOptions = computed<DepartmentSelectOption[]>(() =>
    this.departments()
      .map(department => ({
        name: department.name ?? '',
        value: department.departmentId ?? '',
      }))
      .filter(option => option.value !== '' && option.name !== '')
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly selectedDepartmentId = computed(() => String(this.selectedDepartment()?.value ?? ''));
  readonly canUpload = computed(() => this.selectedDepartmentId() !== '');
  readonly inUseImages = computed(() => this.defaultImages().filter(image => image.isInUse === true));
  readonly notInUseImages = computed(() => this.defaultImages().filter(image => image.isInUse !== true));

  // Default images resource, auto-refetches when department changes
  private readonly defaultImagesParams = computed<GetDefaultJobBannersParams>(() => ({
    departmentId: this.selectedDepartmentId() || undefined,
  }));
  private readonly defaultImagesResource = getDefaultJobBannersResource(this.defaultImagesParams);

  private readonly imageApi = inject(ImageResourceApi);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly preselectedDepartmentId = signal<string>('');

  private readonly syncImagesEffect = effect(() => {
    const images = this.defaultImagesResource.value();
    if (images != null) {
      this.defaultImages.set(images);
    } else if (this.selectedDepartmentId() === '') {
      this.defaultImages.set([]);
    }
  });

  private readonly preselectEffect = effect(() => {
    const departments = this.departments();
    if (departments.length === 0) return;
    const preselected = this.preselectedDepartmentId();
    if (preselected === '' || this.selectedDepartmentId() !== '') return;
    const match = this.departmentOptions().find(option => option.value === preselected);
    if (match) {
      this.selectedDepartment.set(match);
    }
  });

  constructor() {
    this.preselectedDepartmentId.set(this.route.snapshot.queryParamMap.get('departmentId') ?? '');
  }

  onDepartmentChange(selection: DepartmentSelectOption | undefined): void {
    this.selectedDepartment.set(selection);
  }

  uploadDefaultImage = (file: File): Observable<ImageDTO> => {
    const departmentId = this.selectedDepartmentId();
    if (departmentId === '') {
      this.toastService.showErrorKey('researchGroup.departments.images.error.noDepartment');
      return EMPTY;
    }
    return this.imageApi.uploadDefaultJobBanner(departmentId, file);
  };

  onImageUploaded(uploadedImage: ImageDTO): void {
    this.defaultImages.update(images => images.concat(uploadedImage));
  }

  onUploadError(error: ImageUploadError): void {
    this.toastService.showErrorKey(error.errorKey);
  }

  async onDeleteImage(imageId: string | undefined): Promise<void> {
    if (!imageId) {
      return;
    }

    try {
      await firstValueFrom(this.imageApi.deleteImage(imageId));
      this.defaultImages.update(images => images.filter(image => image.imageId !== imageId));
      this.toastService.showSuccessKey('researchGroup.departments.images.success.imageDeleted');
    } catch {
      this.toastService.showErrorKey('researchGroup.departments.images.error.deleteFailed');
    }
  }

}
