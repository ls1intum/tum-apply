import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlassMinus, faMagnifyingGlassPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { ImageDTO } from 'app/generated/model/imageDTO';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '../../components/atoms/button/button.component';
import { ConfirmDialog } from '../../components/atoms/confirm-dialog/confirm-dialog';
import { DialogComponent } from '../../components/atoms/dialog/dialog.component';
import { UserAvatarComponent } from '../../components/atoms/user-avatar/user-avatar.component';
import TranslateDirective from '../../language/translate.directive';

const CROP_CONTAINER_SIZE = 360;
const CROP_RADIUS = 150;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ZOOM_STEP = 0.05;
const BLUR_PADDING_PX = 28;

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
  ],
  templateUrl: './profile-picture-settings.component.html',
})
export class ProfilePictureSettingsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('saveCanvas') saveCanvas!: ElementRef<HTMLCanvasElement>;

  readonly CROP_SIZE = CROP_CONTAINER_SIZE;
  readonly CROP_RADIUS = CROP_RADIUS;

  readonly faMagnifyingGlassMinus = faMagnifyingGlassMinus;
  readonly faMagnifyingGlassPlus = faMagnifyingGlassPlus;
  readonly faRotateRight = faRotateRight;

  cropDialogVisible = signal(false);
  rawImageSrc = signal<string | null>(null);

  zoomFactor = signal(1);
  minZoomFactor = 0.5;
  maxZoomFactor = 3;

  panX = signal(0);
  panY = signal(0);

  fullName = computed<string | undefined>(() => {
    const name = this.accountService.loadedUser()?.name.trim();
    return name === '' ? undefined : name;
  });

  currentProfilePictureUrl = computed<string | null>(() => this.normalizeAvatarUrl(this.accountService.loadedUser()?.avatar));

  imageStyle = computed<Record<string, string>>(() => {
    const scale = this.effectiveScale();
    const pan = this.clampedPanForScale(scale);
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${this.imgNatW()}px`,
      height: `${this.imgNatH()}px`,
      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      'transform-origin': 'center center',
      'pointer-events': 'none',
      'user-select': 'none',
      'max-width': 'none',
    };
  });

  blurImageStyle = computed<Record<string, string>>(() => {
    const scale = this.blurScale();
    const pan = this.clampedPanForScale(scale, CROP_RADIUS + BLUR_PADDING_PX);
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${this.imgNatW()}px`,
      height: `${this.imgNatH()}px`,
      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      'transform-origin': 'center center',
      filter: 'blur(16px) saturate(1.05)',
      opacity: '0.95',
      'pointer-events': 'none',
      'user-select': 'none',
      'max-width': 'none',
    };
  });

  dimOverlayStyle = computed<Record<string, string>>(() => ({
    position: 'absolute',
    inset: '0',
    background: `radial-gradient(circle ${CROP_RADIUS}px at 50% 50%, transparent ${CROP_RADIUS - 1}px, rgba(0,0,0,0.55) ${CROP_RADIUS}px)`,
    'pointer-events': 'none',
  }));

  private readonly accountService = inject(AccountService);
  private readonly http = inject(HttpClient);

  private img: HTMLImageElement | null = null;
  private imgNatW = signal(0);
  private imgNatH = signal(0);

  private dragActive = false;
  private lastX = 0;
  private lastY = 0;

  onAddPictureClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.loadFileForCrop(file);
    input.value = '';
  }

  onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.dragActive = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragActive) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.panX.set(this.panX() + dx);
    this.panY.set(this.panY() + dy);
    this.clampPan();
  }

  onPointerUp(event: PointerEvent): void {
    this.dragActive = false;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  onZoomChange(event: Event): void {
    this.zoomFactor.set(parseFloat((event.target as HTMLInputElement).value));
    this.clampPan();
  }

  zoomOut(): void {
    this.zoomFactor.set(Math.max(this.minZoomFactor, this.zoomFactor() - ZOOM_STEP));
    this.clampPan();
  }

  zoomIn(): void {
    this.zoomFactor.set(Math.min(this.maxZoomFactor, this.zoomFactor() + ZOOM_STEP));
    this.clampPan();
  }

  onCancel(): void {
    this.cropDialogVisible.set(false);
    this.rawImageSrc.set(null);
    this.img = null;
  }

  async onResetPicture(): Promise<void> {
    try {
      await firstValueFrom(this.http.put('/api/users/avatar', { avatarUrl: null }));
      this.accountService.setAvatar(undefined);
    } catch (error) {
      console.error('Failed to reset profile picture', error);
    }
  }

  onRotate(): void {
    if (!this.img) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = this.imgNatH();
    offscreen.height = this.imgNatW();
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.translate(this.imgNatH() / 2, this.imgNatW() / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(this.img, -this.imgNatW() / 2, -this.imgNatH() / 2);

    const rotatedSrc = offscreen.toDataURL('image/png');
    const rotated = new Image();
    rotated.onload = () => {
      this.img = rotated;
      this.imgNatW.set(rotated.naturalWidth);
      this.imgNatH.set(rotated.naturalHeight);
      this.rawImageSrc.set(rotatedSrc);
      this.resetCropState();
    };
    rotated.src = rotatedSrc;
  }

  async onSave(): Promise<void> {
    if (!this.img) return;

    const canvas = this.saveCanvas.nativeElement;
    const outSize = 300;
    canvas.width = outSize;
    canvas.height = outSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const natW = this.imgNatW();
    const natH = this.imgNatH();
    const fgScale = this.effectiveScale();
    const bgScale = this.blurScale();
    const fgPan = this.clampedPanForScale(fgScale);
    const bgPan = this.clampedPanForScale(bgScale, CROP_RADIUS + BLUR_PADDING_PX);

    const fgDisplayW = natW * fgScale;
    const fgDisplayH = natH * fgScale;
    const bgDisplayW = natW * bgScale;
    const bgDisplayH = natH * bgScale;

    const cc = CROP_CONTAINER_SIZE / 2;
    const cropLeft = cc - CROP_RADIUS;
    const cropTop = cc - CROP_RADIUS;
    const scaleToOut = outSize / (CROP_RADIUS * 2);

    const fgLeft = cc + fgPan.x - fgDisplayW / 2;
    const fgTop = cc + fgPan.y - fgDisplayH / 2;
    const bgLeft = cc + bgPan.x - bgDisplayW / 2;
    const bgTop = cc + bgPan.y - bgDisplayH / 2;

    const fgDestX = (fgLeft - cropLeft) * scaleToOut;
    const fgDestY = (fgTop - cropTop) * scaleToOut;
    const fgDestW = fgDisplayW * scaleToOut;
    const fgDestH = fgDisplayH * scaleToOut;

    const bgDestX = (bgLeft - cropLeft) * scaleToOut;
    const bgDestY = (bgTop - cropTop) * scaleToOut;
    const bgDestW = bgDisplayW * scaleToOut;
    const bgDestH = bgDisplayH * scaleToOut;

    ctx.save();
    ctx.beginPath();
    ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.filter = 'blur(16px) saturate(1.05)';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.img, bgDestX, bgDestY, bgDestW, bgDestH);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.img, fgDestX, fgDestY, fgDestW, fgDestH);
    ctx.restore();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;

    try {
      const formData = new FormData();
      formData.append('file', blob, 'profile-picture.jpg');
      const uploadedImage = await firstValueFrom(this.http.post<ImageDTO>('/api/images/upload/profile-picture', formData));
      const avatarUrl = uploadedImage.url ?? null;
      if (!avatarUrl) return;

      await firstValueFrom(this.http.put('/api/users/avatar', { avatarUrl }));
      this.accountService.setAvatar(avatarUrl);

      this.cropDialogVisible.set(false);
      this.rawImageSrc.set(null);
      this.img = null;
    } catch (error) {
      console.error('Failed to save profile picture', error);
    }
  }

  private resetCropState(): void {
    if (this.imgNatW() <= 0 || this.imgNatH() <= 0) return;
    const initialZoom = Math.max(this.minZoomFactor, Math.min(1, this.maxZoomFactor));
    this.zoomFactor.set(initialZoom);
    this.panX.set(0);
    this.panY.set(0);
    this.clampPan();
  }

  private effectiveScale(): number {
    const natW = this.imgNatW();
    const natH = this.imgNatH();
    if (natW <= 0 || natH <= 0) return 1;
    return this.coverScale() * this.zoomFactor();
  }

  private coverScale(): number {
    const natW = this.imgNatW();
    const natH = this.imgNatH();
    if (natW <= 0 || natH <= 0) return 1;
    return Math.max((CROP_RADIUS * 2) / natW, (CROP_RADIUS * 2) / natH);
  }

  private blurScale(): number {
    return this.coverScale() * 1.2;
  }

  private clampPan(): void {
    const scale = this.effectiveScale();
    const pan = this.clampedPanForScale(scale);
    this.panX.set(pan.x);
    this.panY.set(pan.y);
  }

  private clampedPanForScale(scale: number, coverRadius: number = CROP_RADIUS): { x: number; y: number } {
    const natW = this.imgNatW();
    const natH = this.imgNatH();
    if (natW <= 0 || natH <= 0) return { x: 0, y: 0 };
    const displayW = natW * scale;
    const displayH = natH * scale;
    const maxPanX = Math.max(0, displayW / 2 - coverRadius);
    const maxPanY = Math.max(0, displayH / 2 - coverRadius);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, this.panX())),
      y: Math.max(-maxPanY, Math.min(maxPanY, this.panY())),
    };
  }

  private loadFileForCrop(file: File): void {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const image = new Image();
      image.onload = () => {
        this.img = image;
        this.imgNatW.set(image.naturalWidth);
        this.imgNatH.set(image.naturalHeight);
        this.rawImageSrc.set(src);
        this.resetCropState();
        this.cropDialogVisible.set(true);
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  }

  private normalizeAvatarUrl(avatarUrl: string | null | undefined): string | null {
    const normalized = avatarUrl?.trim();
    return normalized ? normalized : null;
  }
}
