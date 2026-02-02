import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { ImageDTO } from 'app/generated/model/imageDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateDirective } from 'app/shared/language';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import {
  ImageUploadButtonComponent,
  ImageUploadError,
} from 'app/shared/components/atoms/image-upload-button/image-upload-button.component';

interface ImageWithJobInfo extends ImageDTO {
  jobId?: string;
}

const I18N_BASE = 'researchGroup.imageLibrary';

@Component({
  selector: 'jhi-research-group-images',
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    ConfirmDialog,
    ProgressSpinnerComponent,
    InfoBoxComponent,
    ImageUploadButtonComponent,
  ],
  templateUrl: './research-group-images.component.html',
})
export class ResearchGroupImagesComponent {
  readonly allImages = signal<ImageWithJobInfo[]>([]);
  readonly isLoading = signal<boolean>(true);

  readonly totalImages = computed(() => this.allImages().length);

  readonly inUseImages = computed(() => this.allImages().filter(img => img.jobId !== undefined));

  readonly notInUseImages = computed(() => this.allImages().filter(img => img.jobId === undefined));

  readonly inUseCount = computed(() => this.inUseImages().length);
  readonly notInUseCount = computed(() => this.notInUseImages().length);

  private readonly imageService = inject(ImageResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    void this.loadImages();
  }

  /**
   * Load all images for the research group
   * Note: Job assignment information would need additional API endpoints
   * to properly link images to jobs. For now, we load just the images.
   */
  async loadImages(): Promise<void> {
    try {
      this.isLoading.set(true);
      const images = await firstValueFrom(this.imageService.getResearchGroupJobBanners());

      // Convert to enriched format, optional: job information
      const enrichedImages: ImageWithJobInfo[] = images.map(image => ({
        ...image,
        jobId: undefined,
      }));

      this.allImages.set(enrichedImages);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.error.loadFailed`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle successful image upload from the shared component
   */
  onImageUploaded(uploadedImage: ImageDTO): void {
    const enrichedImage: ImageWithJobInfo = {
      ...uploadedImage,
    };

    this.allImages.update(images => [...images, enrichedImage]);
    this.toastService.showSuccessKey(`${I18N_BASE}.success.imageUploaded`);
  }

  /**
   * Handle upload errors from the shared component
   */
  onUploadError(error: ImageUploadError): void {
    this.toastService.showErrorKey(error.errorKey);
  }

  /**
   * Delete an image by ID
   */
  async deleteImage(imageId: string): Promise<void> {
    if (!imageId) {
      return;
    }

    try {
      await firstValueFrom(this.imageService.deleteImage(imageId));
      this.allImages.update(images => images.filter(img => img.imageId !== imageId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.imageDeleted`);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.error.deleteFailed`);
    }
  }
}
