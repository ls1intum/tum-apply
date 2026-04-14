import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageCropperComponent } from 'ngx-image-cropper';

import { AccountService } from 'app/core/auth/account.service';
import { ImageResourceApi } from 'app/generated/api/image-resource-api';
import { UserResourceApi } from 'app/generated/api/user-resource-api';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ProfilePictureSettingsComponent } from 'app/shared/settings/profile-picture-settings/profile-picture-settings.component';
import { createAccountServiceMock } from 'util/account.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideThemeServiceMock } from 'util/theme.service.mock';
import { createToastServiceMock } from 'util/toast-service.mock';
import { provideTranslateMock } from 'util/translate.mock';

type AccountServiceTestMock = ReturnType<typeof createAccountServiceMock> & {
  setAvatar: ReturnType<typeof vi.fn>;
};

type ImageCropperTestDouble = Pick<ImageCropperComponent, 'crop'>;

describe('ProfilePictureSettingsComponent', () => {
  let fixture: ComponentFixture<ProfilePictureSettingsComponent>;
  let component: ProfilePictureSettingsComponent;
  let accountServiceMock: AccountServiceTestMock;
  let imageApiMock: { uploadProfilePicture: ReturnType<typeof vi.fn> };
  let userApiMock: { updateAvatar: ReturnType<typeof vi.fn> };
  let toastServiceMock: ReturnType<typeof createToastServiceMock>;

  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(['profile-picture'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const createFileSelectionEvent = (file: File, value: string): Event => {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    input.value = value;

    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      value: input,
    });

    return event;
  };

  const defaultTransform = {
    scale: 1,
    rotate: 0,
    translateH: 0,
    translateV: 0,
    translateUnit: 'px',
  };

  const getButtons = () => fixture.debugElement.queryAll(By.directive(ButtonComponent));
  const setImageCropper = (cropper: ImageCropperTestDouble | undefined): void => {
    Object.assign(component, {
      imageCropper: () => cropper,
    });
  };

  beforeEach(async () => {
    accountServiceMock = createAccountServiceMock() as AccountServiceTestMock;
    accountServiceMock.user.set({
      id: 'user-1',
      name: ' Ada Lovelace ',
      email: 'ada@example.com',
      avatar: '/images/original-avatar.jpg',
      authorities: [],
    });
    accountServiceMock.setAvatar = vi.fn((avatarUrl: string | undefined) => {
      accountServiceMock.user.update(currentUser => (currentUser ? Object.assign({}, currentUser, { avatar: avatarUrl }) : currentUser));
    });

    imageApiMock = { uploadProfilePicture: vi.fn() };
    userApiMock = { updateAvatar: vi.fn() };
    toastServiceMock = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ProfilePictureSettingsComponent],
      providers: [
        { provide: AccountService, useValue: accountServiceMock },
        { provide: ImageResourceApi, useValue: imageApiMock },
        { provide: UserResourceApi, useValue: userApiMock },
        { provide: ToastService, useValue: toastServiceMock },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideThemeServiceMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePictureSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and normalize the current user data', () => {
    expect(component).toBeTruthy();
    expect(component.fullName()).toBe('Ada Lovelace');
    expect(component.currentProfilePictureUrl()).toBe('/images/original-avatar.jpg');

    accountServiceMock.user.update(currentUser =>
      currentUser ? Object.assign({}, currentUser, { name: '   ', avatar: '   ' }) : currentUser,
    );
    fixture.detectChanges();

    expect(component.fullName()).toBeUndefined();
    expect(component.currentProfilePictureUrl()).toBeNull();
  });

  it('should open the file picker and disable remove when no avatar exists', () => {
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    (getButtons()[0].nativeElement as HTMLElement).click();
    expect(clickSpy).toHaveBeenCalledOnce();

    accountServiceMock.user.update(currentUser => (currentUser ? Object.assign({}, currentUser, { avatar: undefined }) : currentUser));
    fixture.detectChanges();

    const removeButton = getButtons()[1].componentInstance as ButtonComponent;
    expect(removeButton.disabled()).toBe(true);
  });

  it('should validate file selection and open the crop dialog only for valid images', () => {
    component.onFileSelected(createFileSelectionEvent(createMockFile('avatar.gif', 'image/gif', 1024), 'invalid'));

    component.onFileSelected(createFileSelectionEvent(createMockFile('large.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1), 'large'));

    const validFile = createMockFile('avatar.png', 'image/png', 1024);
    const validEvent = createFileSelectionEvent(validFile, 'valid');
    component.onFileSelected(validEvent);

    expect(toastServiceMock.showErrorKey).toHaveBeenNthCalledWith(1, 'settings.profilePicture.invalidFileType');
    expect(toastServiceMock.showErrorKey).toHaveBeenNthCalledWith(2, 'settings.profilePicture.fileTooLarge');
    expect(component.selectedFile()).toBe(validFile);
    expect(component.cropDialogVisible()).toBe(true);
    expect(component.cropTransform).toEqual(defaultTransform);
    expect((validEvent.target as HTMLInputElement).value).toBe('');
  });

  it('should update crop state and reset on image load failure', () => {
    component.onImageLoaded();
    component.onTransformChange({
      scale: 2,
      rotate: 90,
      flipH: true,
      flipV: false,
      translateH: 8,
      translateV: 12,
      translateUnit: '%',
    });
    component.selectedFile.set(createMockFile('avatar.jpg', 'image/jpeg', 1024));
    component.cropDialogVisible.set(true);

    component.onLoadImageFailed();

    expect(component.imageLoaded()).toBe(false);
    expect(component.selectedFile()).toBeUndefined();
    expect(component.cropDialogVisible()).toBe(false);
    expect(component.cropTransform).toEqual(defaultTransform);
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.invalidFileType');
  });

  it('should save the cropped picture and reset the dialog', async () => {
    const blob = new Blob(['cropped'], { type: 'image/jpeg' });
    component.selectedFile.set(createMockFile('avatar.jpg', 'image/jpeg', 1024));
    component.cropDialogVisible.set(true);
    component.imageLoaded.set(true);
    setImageCropper({
      crop: vi.fn().mockResolvedValue({ blob }),
    });
    imageApiMock.uploadProfilePicture.mockReturnValue(of({ imageId: 'img-1', url: '/images/uploaded-avatar.jpg' }));

    await component.onSave();

    expect(imageApiMock.uploadProfilePicture).toHaveBeenCalledOnce();
    expect(accountServiceMock.setAvatar).toHaveBeenCalledWith('/images/uploaded-avatar.jpg');
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.profilePicture.saved');
    expect(component.selectedFile()).toBeUndefined();
    expect(component.cropDialogVisible()).toBe(false);
    expect(component.imageLoaded()).toBe(false);
  });

  it('should not upload without a cropped blob and should show an error when upload fails', async () => {
    setImageCropper(undefined);
    await component.onSave();

    setImageCropper({
      crop: vi.fn().mockResolvedValue({ blob: undefined }),
    });
    await component.onSave();

    const blob = new Blob(['cropped'], { type: 'image/jpeg' });
    setImageCropper({
      crop: vi.fn().mockResolvedValue({ blob }),
    });
    imageApiMock.uploadProfilePicture.mockReturnValue(throwError(() => new Error('upload failed')));

    await component.onSave();

    expect(imageApiMock.uploadProfilePicture).toHaveBeenCalledOnce();
    expect(accountServiceMock.setAvatar).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.saveFailed');
  });

  it('should remove the current profile picture', async () => {
    userApiMock.updateAvatar.mockReturnValue(of(undefined));

    await component.onResetPicture();

    expect(userApiMock.updateAvatar).toHaveBeenCalledWith({});
    expect(accountServiceMock.setAvatar).toHaveBeenCalledWith(undefined);
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.profilePicture.deleted');
  });

  it('should show an error when removing the profile picture fails', async () => {
    userApiMock.updateAvatar.mockReturnValue(throwError(() => new Error('delete failed')));

    await component.onResetPicture();

    expect(accountServiceMock.setAvatar).not.toHaveBeenCalled();
    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.deleteFailed');
  });
});
