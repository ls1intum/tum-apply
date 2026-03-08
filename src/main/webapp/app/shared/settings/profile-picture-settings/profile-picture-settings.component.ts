import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { ImageCropperComponent, ImageTransform } from 'ngx-image-cropper';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';

const CROP_CONTAINER_SIZE = 360;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'jhi-profile-picture-settings',
  standalone: true,
  imports: [
    ButtonComponent,
    ConfirmDialog,
    DialogComponent,
    TranslateDirective,
    TranslateModule,
    FormsModule,
    FontAwesomeModule,
    TooltipModule,
    UserAvatarComponent,
    ImageCropperComponent,
  ],
  templateUrl: './profile-picture-settings.component.html',
})
export class ProfilePictureSettingsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(ImageCropperComponent) imageCropper?: ImageCropperComponent;

  readonly CROP_SIZE = CROP_CONTAINER_SIZE;

  // Dialog + image source state used by the cropper overlay.
  cropDialogVisible = signal(false);
  selectedFile = signal<File | undefined>(undefined);
  imageLoaded = signal(false);
  cropTransform: ImageTransform = this.createDefaultTransform();

  fullName = computed<string | undefined>(() => {
    const name = this.accountService.loadedUser()?.name.trim();
    return name === '' ? undefined : name;
  });

  currentProfilePictureUrl = computed<string | null>(() => this.normalizeAvatarUrl(this.accountService.loadedUser()?.avatar));

  private readonly accountService = inject(AccountService);
  private readonly imageResourceService = inject(ImageResourceApiService);
  private readonly toastService = inject(ToastService);
  private readonly userResourceService = inject(UserResourceApiService);

  onAddPictureClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    this.loadFileForCrop(file);
    fileInput.value = '';
  }

  onCancel(): void {
    this.resetCropDialog();
  }

  async onResetPicture(): Promise<void> {
    try {
      await firstValueFrom(this.userResourceService.updateAvatar({}));
      this.accountService.setAvatar(undefined);
      this.toastService.showSuccessKey('settings.profilePicture.deleted');
    } catch {
      this.toastService.showErrorKey('settings.profilePicture.deleteFailed');
    }
  }

  /**
   * Crops the current image through the cropper library, uploads the generated JPEG
   * and updates the in-memory avatar shown in the app shell.
   */
  async onSave(): Promise<void> {
    if (!this.imageCropper) return;
    const cropped = await this.imageCropper.crop('blob');
    if (!cropped) return;
    const blob = cropped.blob;
    if (!blob) return;

    try {
      const uploadedImage = await firstValueFrom(this.imageResourceService.uploadProfilePicture(blob));
      const avatarUrl = this.normalizeAvatarUrl(uploadedImage.url);
      if (avatarUrl === null) {
        this.toastService.showErrorKey('settings.profilePicture.saveFailed');
        return;
      }

      this.accountService.setAvatar(avatarUrl);
      this.toastService.showSuccessKey('settings.profilePicture.saved');
      this.resetCropDialog();
    } catch {
      this.toastService.showErrorKey('settings.profilePicture.saveFailed');
    }
  }

  onImageLoaded(): void {
    this.imageLoaded.set(true);
  }

  onTransformChange(transform: ImageTransform): void {
    this.cropTransform = this.normalizeTransform(transform);
  }

  onLoadImageFailed(): void {
    this.toastService.showErrorKey('settings.profilePicture.invalidFileType');
    this.resetCropDialog();
  }

  /**
   * Validates the selected file and opens the crop dialog. The cropper library
   * handles image loading, touch gestures and crop interactions.
   */
  private loadFileForCrop(file: File): void {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      this.toastService.showErrorKey('settings.profilePicture.fileTooLarge');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      this.toastService.showErrorKey('settings.profilePicture.invalidFileType');
      return;
    }
    this.selectedFile.set(file);
    this.imageLoaded.set(false);
    this.cropTransform = this.createDefaultTransform();
    this.cropDialogVisible.set(true);
  }

  private normalizeAvatarUrl(avatarUrl: string | null | undefined): string | null {
    const normalized = avatarUrl?.trim();
    if (normalized == null || normalized === '') {
      return null;
    }
    return normalized;
  }

  private resetCropDialog(): void {
    this.cropDialogVisible.set(false);
    this.selectedFile.set(undefined);
    this.imageLoaded.set(false);
    this.cropTransform = this.createDefaultTransform();
  }

  private normalizeTransform(transform: ImageTransform): ImageTransform {
    return {
      translateUnit: 'px',
      ...transform,
    };
  }

  private createDefaultTransform(): ImageTransform {
    return {
      scale: 1,
      rotate: 0,
      translateH: 0,
      translateV: 0,
      translateUnit: 'px',
    };
  }
}
