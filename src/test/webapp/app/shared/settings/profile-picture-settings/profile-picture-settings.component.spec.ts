import { ElementRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { AccountService, User } from 'app/core/auth/account.service';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { ThemeService } from 'app/service/theme.service';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { ProfilePictureSettingsComponent } from 'app/shared/settings/profile-picture-settings/profile-picture-settings.component';

describe('ProfilePictureSettingsComponent', () => {
  let fixture: ComponentFixture<ProfilePictureSettingsComponent>;
  let component: ProfilePictureSettingsComponent;

  let loadedUserSignal: ReturnType<typeof signal<User | undefined>>;

  const accountServiceMock = {
    loadedUser: () => loadedUserSignal(),
    setAvatar: vi.fn(),
  };

  const imageResourceServiceMock = {
    uploadProfilePicture: vi.fn(),
  };

  const userResourceServiceMock = {
    updateAvatar: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  beforeEach(() => {
    loadedUserSignal = signal<User | undefined>({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatar: '/images/profiles/old.jpg',
    });

    TestBed.configureTestingModule({
      imports: [ProfilePictureSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AccountService, useValue: accountServiceMock },
        { provide: ImageResourceApiService, useValue: imageResourceServiceMock },
        { provide: UserResourceApiService, useValue: userResourceServiceMock },
        { provide: ThemeService, useValue: { theme: signal<'light' | 'dark' | 'blossom' | 'aquabloom'>('light') } },
        provideToastServiceMock(toastServiceMock),
      ],
    });

    fixture = TestBed.createComponent(ProfilePictureSettingsComponent);
    component = fixture.componentInstance;

    vi.clearAllMocks();
  });

  it('resets the avatar through UserResourceApiService', async () => {
    userResourceServiceMock.updateAvatar.mockReturnValue(of(undefined));

    await component.onResetPicture();

    expect(userResourceServiceMock.updateAvatar).toHaveBeenCalledWith({});
    expect(accountServiceMock.setAvatar).toHaveBeenCalledWith(undefined);
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.profilePicture.deleted');
  });

  it('uploads the cropped image without issuing a second avatar update request', async () => {
    const fakeCanvasContext = {
      save: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
      filter: 'none',
      globalAlpha: 1,
    };

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(fakeCanvasContext),
      toBlob: vi.fn().mockImplementation((callback: BlobCallback) => callback(new Blob(['avatar'], { type: 'image/jpeg' }))),
    };

    component.saveCanvas = new ElementRef(fakeCanvas as unknown as HTMLCanvasElement);
    component.cropDialogVisible.set(true);
    component.rawImageSrc.set('data:image/jpeg;base64,abc');
    (component as any).img = {} as HTMLImageElement;
    (component as any).imgNatW.set(300);
    (component as any).imgNatH.set(300);

    imageResourceServiceMock.uploadProfilePicture.mockReturnValue(of({ url: '/images/profiles/new.jpg' }));

    await component.onSave();

    expect(imageResourceServiceMock.uploadProfilePicture).toHaveBeenCalledTimes(1);
    expect(userResourceServiceMock.updateAvatar).not.toHaveBeenCalled();
    expect(accountServiceMock.setAvatar).toHaveBeenCalledWith('/images/profiles/new.jpg');
    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.profilePicture.saved');
    expect(component.cropDialogVisible()).toBe(false);
    expect(component.rawImageSrc()).toBeNull();
  });

  it('shows an error toast when deleting the avatar fails', async () => {
    userResourceServiceMock.updateAvatar.mockImplementation(() => {
      throw new Error('delete failed');
    });

    await component.onResetPicture();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.deleteFailed');
  });

  it('shows an error toast when uploading the cropped image fails', async () => {
    const fakeCanvasContext = {
      save: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
      filter: 'none',
      globalAlpha: 1,
    };

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(fakeCanvasContext),
      toBlob: vi.fn().mockImplementation((callback: BlobCallback) => callback(new Blob(['avatar'], { type: 'image/jpeg' }))),
    };

    component.saveCanvas = new ElementRef(fakeCanvas as unknown as HTMLCanvasElement);
    component.cropDialogVisible.set(true);
    component.rawImageSrc.set('data:image/jpeg;base64,abc');
    (component as any).img = {} as HTMLImageElement;
    (component as any).imgNatW.set(300);
    (component as any).imgNatH.set(300);

    imageResourceServiceMock.uploadProfilePicture.mockImplementation(() => {
      throw new Error('upload failed');
    });

    await component.onSave();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.saveFailed');
  });

  it('shows an error toast for files that are too large', () => {
    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'profile.jpg', { type: 'image/jpeg' });

    (component as any).loadFileForCrop(oversizedFile);

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.fileTooLarge');
  });

  it('shows an error toast for unsupported file types', () => {
    const unsupportedFile = new File([new Uint8Array([1, 2, 3])], 'profile.gif', { type: 'image/gif' });

    (component as any).loadFileForCrop(unsupportedFile);

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.profilePicture.invalidFileType');
  });
});
