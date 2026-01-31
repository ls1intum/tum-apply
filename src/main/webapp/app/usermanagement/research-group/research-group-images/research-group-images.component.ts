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

interface ImageWithJobInfo extends ImageDTO {
  jobId?: string;
}

const I18N_BASE = 'researchGroup.imageLibrary';

/**
 * ResearchGroupImagesComponent
 *
 * Displays and manages the research group's image library.
 * Professors can:
 * - View all images uploaded by their research group
 * - See which images are assigned to job positions
 * - Filter images by status (All, Assigned, Available)
 * - Upload new images
 * - Delete images (if not assigned to positions)
 * - View detailed information about each image
 */
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
  ],
  templateUrl: './research-group-images.component.html',
})
export class ResearchGroupImagesComponent {
  // State signals
  readonly allImages = signal<ImageWithJobInfo[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isUploadingImage = signal<boolean>(false);

  readonly acceptedImageTypes = 'image/jpeg,image/jpg,image/png,image/webp';

  readonly totalImages = computed(() => this.allImages().length);

  readonly inUseImages = computed(() => this.allImages().filter(img => img.jobId !== undefined));

  readonly notInUseImages = computed(() => this.allImages().filter(img => img.jobId === undefined));

  readonly inUseCount = computed(() => this.inUseImages().length);
  readonly notInUseCount = computed(() => this.notInUseImages().length);

  /** Computed: CSS classes for the upload container based on upload state */
  readonly uploadContainerClasses = computed(() => {
    if (this.isUploadingImage()) {
      return 'relative rounded-lg transition-all opacity-50 pointer-events-none';
    }
    return 'relative rounded-lg transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1';
  });

  /** Computed: CSS classes for the inner upload area */
  readonly uploadInnerClasses = computed(() => {
    const base = 'aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all';
    const hover = !this.isUploadingImage() ? 'hover:border-primary hover:bg-background-surface-alt' : '';
    return `${base} border-border-default ${hover}`.trim();
  });

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

      // Convert to enriched format
      // In a full implementation, you would fetch job data and match by imageId
      const enrichedImages: ImageWithJobInfo[] = images.map(image => ({
        ...image,
        // This would be populated by matching with job data
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
   * Handle image file selection and upload
   */
  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate file size (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.toastService.showErrorKey(`${I18N_BASE}.error.fileTooLarge`);
      input.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.showErrorKey(`${I18N_BASE}.error.invalidFileType`);
      input.value = '';
      return;
    }

    try {
      this.isUploadingImage.set(true);
      const uploadedImage = await firstValueFrom(this.imageService.uploadJobBanner(file));

      // Add to the list
      const enrichedImage: ImageWithJobInfo = {
        ...uploadedImage,
      };

      this.allImages.update(images => [...images, enrichedImage]);
      this.toastService.showSuccessKey(`${I18N_BASE}.success.imageUploaded`);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.error.uploadFailed`);
    } finally {
      this.isUploadingImage.set(false);
      input.value = '';
    }
  }

  /**
   * Delete an image by ID (called from confirm dialog)
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
