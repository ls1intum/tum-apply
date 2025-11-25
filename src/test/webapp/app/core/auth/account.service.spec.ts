import { AccountService } from 'app/core/auth/account.service';
import { of, throwError } from 'rxjs';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

class MockUserResourceApiService {
  getCurrentUser = vi.fn();
  updateUserName = vi.fn();
  updatePassword = vi.fn();
}

describe('AccountService', () => {
  let service: AccountService;
  let api: MockUserResourceApiService;

  beforeEach(() => {
    api = new MockUserResourceApiService();
    TestBed.configureTestingModule({
      providers: [AccountService, { provide: UserResourceApiService, useValue: api }],
    });
    service = TestBed.inject(AccountService);
  });

  it('loads user successfully and sets signals', async () => {
    api.getCurrentUser.mockReturnValue(
      of({
        userId: 'U1',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        researchGroup: { id: 'RG1', name: 'Group' },
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
      }),
    );
    await service.loadUser();
    expect(service.loaded()).toBe(true);
    const user = service.user();
    expect(user?.id).toBe('U1');
    expect(user?.email).toBe('user@example.com');
    expect(user?.name).toBe('Jane Doe');
    expect(user?.researchGroup).toMatchObject({ id: 'RG1', name: 'Group' });
    expect(user?.authorities).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
    expect(service.signedIn()).toBe(true);
  });

  it('handles missing user id (unauthenticated)', async () => {
    api.getCurrentUser.mockReturnValue(of({ userId: undefined }));
    await service.loadUser();
    expect(service.loaded()).toBe(true);
    expect(service.user()).toBeUndefined();
    expect(service.signedIn()).toBe(false);
  });

  it('handles error fetching user', async () => {
    api.getCurrentUser.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await service.loadUser();
    expect(consoleSpy).toHaveBeenCalled();
    expect(service.loaded()).toBe(true);
    expect(service.user()).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('hasAnyAuthority returns true when one required role present', async () => {
    api.getCurrentUser.mockReturnValue(of({ userId: 'U2', firstName: 'A', lastName: 'B', roles: ['ROLE_USER'] }));
    await service.loadUser();
    expect(service.hasAnyAuthority(['ROLE_USER', 'ROLE_ADMIN'])).toBe(true);
    expect(service.hasAnyAuthority(['ROLE_ADMIN'])).toBe(false);
  });

  it('updateUser normalizes whitespace and reloads user', async () => {
    api.getCurrentUser.mockReturnValue(of({ userId: 'U3', firstName: 'F', lastName: 'L', roles: [] }));
    await service.loadUser();
    api.updateUserName.mockReturnValue(of(void 0));
    const loadSpy = vi.spyOn(service, 'loadUser');
    await service.updateUser('  New  ', '  Name  ');
    expect(api.updateUserName).toHaveBeenCalledWith({ firstName: 'New', lastName: 'Name' });
    expect(loadSpy).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('updatePassword trims and calls API when non-empty', async () => {
    api.updatePassword.mockReturnValue(of(void 0));
    await service.updatePassword('  secret  ');
    expect(api.updatePassword).toHaveBeenCalledWith({ newPassword: 'secret' });
    vi.clearAllMocks();
  });

  it('updatePassword does nothing when empty after trim', async () => {
    api.updatePassword.mockReturnValue(of(void 0));
    await service.updatePassword('   ');
    expect(api.updatePassword).not.toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('exposes convenience getters', async () => {
    api.getCurrentUser.mockReturnValue(of({ userId: 'U4', email: 'mail@test.org', firstName: 'A', lastName: 'B', roles: ['R1'] }));
    await service.loadUser();
    expect(service.userId).toBe('U4');
    expect(service.userEmail).toBe('mail@test.org');
    expect(service.userName).toBe('A B');
    expect(service.userResearchGroup).toBeUndefined();
    expect(service.userAuthorities).toEqual(['R1']);
  });

  it('signedIn false before load', () => {
    expect(service.signedIn()).toBe(false);
    expect(service.loaded()).toBe(false);
  });
});
