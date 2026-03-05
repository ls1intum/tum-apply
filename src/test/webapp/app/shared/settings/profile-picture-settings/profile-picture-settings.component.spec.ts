import { computed, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService, User } from 'app/core/auth/account.service';
import { ProfilePictureSettingsComponent } from 'app/shared/settings/profile-picture-settings/profile-picture-settings.component';
import { provideFontAwesomeTesting } from '../../../../util/fontawesome.testing';
import { provideTranslateMock } from '../../../../util/translate.mock';

describe('ProfilePictureSettingsComponent', () => {
  let userSignal: ReturnType<typeof signal<User | undefined>>;
  let setAvatar: ReturnType<typeof vi.fn>;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    userSignal = signal<User | undefined>({
      id: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      authorities: [],
    });

    setAvatar = vi.fn((avatarUrl: string | undefined) => {
      userSignal.update(user => (user ? { ...user, avatar: avatarUrl } : user));
    });

    TestBed.configureTestingModule({
      imports: [ProfilePictureSettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        {
          provide: AccountService,
          useValue: {
            loadedUser: computed(() => userSignal()),
            setAvatar,
          } satisfies Pick<AccountService, 'loadedUser' | 'setAvatar'>,
        },
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('initializes currentProfilePictureUrl from loaded account avatar', () => {
    const fixture = TestBed.createComponent(ProfilePictureSettingsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.currentProfilePictureUrl()).toBe('https://example.com/avatar.jpg');
  });

  it('normalizes whitespace avatar url to null', () => {
    userSignal.set({
      id: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      avatar: '   ',
      authorities: [],
    });

    const fixture = TestBed.createComponent(ProfilePictureSettingsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.currentProfilePictureUrl()).toBeNull();
  });

  it('clears avatar in account state on reset', async () => {
    const fixture = TestBed.createComponent(ProfilePictureSettingsComponent);
    fixture.detectChanges();

    const resetPromise = fixture.componentInstance.onResetPicture();
    const req = httpTestingController.expectOne('/api/users/avatar');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ avatarUrl: null });
    req.flush({});

    await resetPromise;

    expect(setAvatar).toHaveBeenCalledWith(undefined);
    expect(fixture.componentInstance.currentProfilePictureUrl()).toBeNull();
  });
});
