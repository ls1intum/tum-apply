import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ManageUserFormComponent } from 'app/usermanagement/manage-users/manage-user-form.component';
import { AdminUserDetailDTO } from 'app/generated/model/admin-user-detail-dto';

import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideTranslateMock, createTranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideRouterMock, createRouterMock, RouterMock } from 'util/router.mock';
import { provideActivatedRouteMock, createActivatedRouteMock } from 'util/activated-route.mock';
import { provideLocationMock } from 'util/location.mock';
import {
  createUserAdminResourceApiMock,
  provideUserAdminResourceApiMock,
  UserAdminResourceApiMock,
} from 'util/user-admin-resource-api.service.mock';

describe('ManageUserFormComponent', () => {
  let mockUserAdminApi: UserAdminResourceApiMock;
  let mockToastService: ToastServiceMock;
  let mockRouter: RouterMock;

  const loadedUser: AdminUserDetailDTO = {
    userId: 'user-1',
    firstName: 'Alice',
    lastName: 'Anderson',
    email: 'alice@example.com',
    universityId: 'TUM-001',
    phoneNumber: '+49 89 1234',
    website: 'https://alice.example',
    linkedinUrl: 'https://linkedin.com/in/alice',
    gender: 'female',
    nationality: 'de',
    selectedLanguage: 'de',
    birthday: '1990-01-01',
  };

  async function setupComponent(
    params: Record<string, string> = {},
    query: Record<string, string> = {},
  ): Promise<ComponentFixture<ManageUserFormComponent>> {
    TestBed.resetTestingModule();
    mockUserAdminApi = createUserAdminResourceApiMock();
    mockUserAdminApi.getUser.mockReturnValue(of(loadedUser));
    mockUserAdminApi.createUser.mockReturnValue(of({ userId: 'new-user-1' } as AdminUserDetailDTO));
    mockUserAdminApi.importUser.mockReturnValue(of({ userId: 'new-user-2' } as AdminUserDetailDTO));
    mockUserAdminApi.updateUser.mockReturnValue(of({ userId: 'user-1', firstName: 'Alicia' } as AdminUserDetailDTO));
    mockUserAdminApi.deleteUser.mockReturnValue(of(undefined));

    mockToastService = createToastServiceMock();
    mockRouter = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ManageUserFormComponent],
      providers: [
        provideUserAdminResourceApiMock(mockUserAdminApi),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(createTranslateServiceMock()),
        provideFontAwesomeTesting(),
        provideRouterMock(mockRouter),
        provideActivatedRouteMock(createActivatedRouteMock(params, query)),
        provideLocationMock(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ManageUserFormComponent);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    return fixture;
  }

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mode detection', () => {
    it('should default to create mode when no params', async () => {
      const fixture = await setupComponent();
      expect(fixture.componentInstance.mode()).toBe('create');
      expect(mockUserAdminApi.getUser).not.toHaveBeenCalled();
      expect(fixture.componentInstance.title()).toBe('manageUsersPage.form.createTitle');
      expect(fixture.componentInstance.submitLabel()).toBe('manageUsersPage.form.buttons.createUser');
    });

    it('should set import mode when query mode=import', async () => {
      const fixture = await setupComponent({}, { mode: 'import' });
      expect(fixture.componentInstance.mode()).toBe('import');
      expect(fixture.componentInstance.title()).toBe('manageUsersPage.form.importTitle');
      expect(fixture.componentInstance.submitLabel()).toBe('manageUsersPage.form.buttons.importUser');
      expect(mockUserAdminApi.getUser).not.toHaveBeenCalled();
    });

    it('should set edit mode when userId route param is present and load the user', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      expect(component.mode()).toBe('edit');
      expect(mockUserAdminApi.getUser).toHaveBeenCalledWith('user-1');
      expect(component.loadedUser()).toEqual(loadedUser);
      expect(component.form.controls.firstName.value).toBe('Alice');
      expect(component.form.controls.lastName.value).toBe('Anderson');
      expect(component.form.getRawValue().email).toBe('alice@example.com');
      expect(component.form.controls.email.disabled).toBe(true);
      expect(component.title()).toBe('manageUsersPage.form.editTitle');
      expect(component.submitLabel()).toBe('manageUsersPage.form.buttons.save');
    });

    it('should toast on user-load failure in edit mode', async () => {
      TestBed.resetTestingModule();
      mockUserAdminApi = createUserAdminResourceApiMock();
      mockUserAdminApi.getUser.mockReturnValue(throwError(() => new Error('not found')));
      mockToastService = createToastServiceMock();
      mockRouter = createRouterMock();

      await TestBed.configureTestingModule({
        imports: [ManageUserFormComponent],
        providers: [
          provideUserAdminResourceApiMock(mockUserAdminApi),
          provideToastServiceMock(mockToastService),
          provideTranslateMock(createTranslateServiceMock()),
          provideFontAwesomeTesting(),
          provideRouterMock(mockRouter),
          provideActivatedRouteMock(createActivatedRouteMock({ userId: 'user-1' })),
          provideLocationMock(),
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(ManageUserFormComponent);
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('manageUsersPage.errors.loadUser');
    });
  });

  describe('Validators per mode', () => {
    it('should require password and identity fields in create mode', async () => {
      const fixture = await setupComponent();
      const form = fixture.componentInstance.form;

      form.patchValue({ firstName: '', lastName: '', email: '', password: '' });
      expect(form.controls.firstName.hasError('required')).toBe(true);
      expect(form.controls.lastName.hasError('required')).toBe(true);
      expect(form.controls.email.hasError('required')).toBe(true);
      expect(form.controls.password.hasError('required')).toBe(true);

      form.controls.password.setValue('short1A');
      expect(form.controls.password.hasError('pattern')).toBe(true);
      form.controls.password.setValue('LongEnough1');
      expect(form.controls.password.errors).toBeNull();
    });

    it('should require only keycloakUserId in import mode and skip password', async () => {
      const fixture = await setupComponent({}, { mode: 'import' });
      const form = fixture.componentInstance.form;

      form.patchValue({ firstName: '', lastName: '', email: '', password: '', keycloakUserId: '' });

      expect(form.controls.keycloakUserId.hasError('required')).toBe(true);
      expect(form.controls.firstName.errors).toBeNull();
      expect(form.controls.lastName.errors).toBeNull();
      expect(form.controls.email.errors).toBeNull();
      expect(form.controls.password.errors).toBeNull();
    });

    it('should not require password or keycloakUserId in edit mode', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const form = fixture.componentInstance.form;

      form.patchValue({ firstName: '', lastName: '', password: '', keycloakUserId: '' });
      expect(form.controls.firstName.hasError('required')).toBe(true);
      expect(form.controls.lastName.hasError('required')).toBe(true);
      expect(form.controls.password.errors).toBeNull();
      expect(form.controls.keycloakUserId.errors).toBeNull();
    });
  });

  describe('Submit', () => {
    it('should call createUser in create mode and navigate to the new user page', async () => {
      const fixture = await setupComponent();
      const component = fixture.componentInstance;

      component.form.patchValue({
        firstName: 'Carol',
        lastName: 'Carter',
        email: 'carol@example.com',
        password: 'StrongPass1',
      });

      await component.onSubmit();

      expect(mockUserAdminApi.createUser).toHaveBeenCalledOnce();
      const dto = mockUserAdminApi.createUser.mock.calls[0][0];
      expect(dto.firstName).toBe('Carol');
      expect(dto.lastName).toBe('Carter');
      expect(dto.email).toBe('carol@example.com');
      expect(dto.password).toBe('StrongPass1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users', 'new-user-1']);
      expect(mockToastService.showSuccess).toHaveBeenCalledOnce();
    });

    it('should call importUser in import mode and navigate to the new user page', async () => {
      const fixture = await setupComponent({}, { mode: 'import' });
      const component = fixture.componentInstance;

      component.form.patchValue({ keycloakUserId: 'kc-id-123' });

      await component.onSubmit();

      expect(mockUserAdminApi.importUser).toHaveBeenCalledWith({ keycloakUserId: 'kc-id-123' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users', 'new-user-2']);
      expect(mockToastService.showSuccess).toHaveBeenCalledOnce();
    });

    it('should call updateUser in edit mode and stay on the page', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      component.form.patchValue({ firstName: 'Alicia' });

      await component.onSubmit();

      expect(mockUserAdminApi.updateUser).toHaveBeenCalledOnce();
      const [calledUserId, dto] = mockUserAdminApi.updateUser.mock.calls[0];
      expect(calledUserId).toBe('user-1');
      expect(dto.firstName).toBe('Alicia');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(component.loadedUser()?.firstName).toBe('Alicia');
      expect(mockToastService.showSuccess).toHaveBeenCalledOnce();
    });

    it('should mark form as touched and skip the API call when invalid', async () => {
      const fixture = await setupComponent();
      const component = fixture.componentInstance;

      await component.onSubmit();

      expect(mockUserAdminApi.createUser).not.toHaveBeenCalled();
      expect(component.form.controls.firstName.touched).toBe(true);
    });

    it('should toast error on create failure', async () => {
      const fixture = await setupComponent();
      const component = fixture.componentInstance;

      mockUserAdminApi.createUser.mockReturnValue(throwError(() => new Error('boom')));
      component.form.patchValue({
        firstName: 'Carol',
        lastName: 'Carter',
        email: 'carol@example.com',
        password: 'StrongPass1',
      });

      await component.onSubmit();

      expect(mockToastService.showError).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should toast error on import failure', async () => {
      const fixture = await setupComponent({}, { mode: 'import' });
      const component = fixture.componentInstance;

      mockUserAdminApi.importUser.mockReturnValue(throwError(() => new Error('boom')));
      component.form.patchValue({ keycloakUserId: 'kc-id-123' });

      await component.onSubmit();

      expect(mockToastService.showError).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should toast error on update failure', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      mockUserAdminApi.updateUser.mockReturnValue(throwError(() => new Error('boom')));
      component.form.patchValue({ firstName: 'Alicia' });

      await component.onSubmit();

      expect(mockToastService.showError).toHaveBeenCalledOnce();
    });
  });

  describe('Delete', () => {
    it('should open the delete dialog only in edit mode', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      component.onRequestDelete();
      expect(component.showDeleteDialog()).toBe(true);
    });

    it('should ignore delete requests in create or import mode', async () => {
      const createFixture = await setupComponent();
      createFixture.componentInstance.onRequestDelete();
      expect(createFixture.componentInstance.showDeleteDialog()).toBe(false);

      const importFixture = await setupComponent({}, { mode: 'import' });
      importFixture.componentInstance.onRequestDelete();
      expect(importFixture.componentInstance.showDeleteDialog()).toBe(false);
    });

    it('should call deleteUser after confirm and navigate to the list', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      await component.onConfirmDelete();

      expect(mockUserAdminApi.deleteUser).toHaveBeenCalledWith('user-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users']);
      expect(mockToastService.showSuccess).toHaveBeenCalledOnce();
    });

    it('should toast error when delete fails', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      mockUserAdminApi.deleteUser.mockReturnValueOnce(throwError(() => new Error('forbidden')));
      mockRouter.navigate.mockClear();

      await component.onConfirmDelete();

      expect(mockToastService.showError).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/manage-users']);
    });

    it('should be a no-op when no user is loaded', async () => {
      const fixture = await setupComponent();
      const component = fixture.componentInstance;

      await component.onConfirmDelete();

      expect(mockUserAdminApi.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('Select option helpers', () => {
    it('should keep the selected gender, nationality, language, and birthday signals in sync', async () => {
      const fixture = await setupComponent();
      const component = fixture.componentInstance;

      component.updateGender({ value: 'female', name: 'genders.female' });
      component.updateNationality({ value: 'de', name: 'nationality.de' });
      component.updateLanguage({ value: 'en', name: 'languages.en' });
      component.updateBirthday('1990-01-01');

      expect(component.selectedGender()?.value).toBe('female');
      expect(component.selectedNationality()?.value).toBe('de');
      expect(component.selectedLanguage()?.value).toBe('en');
      expect(component.birthday()).toBe('1990-01-01');

      component.updateBirthday(undefined);
      expect(component.birthday()).toBe('');
    });

    it('should populate select option signals from the loaded user in edit mode', async () => {
      const fixture = await setupComponent({ userId: 'user-1' });
      const component = fixture.componentInstance;

      expect(component.selectedGender()?.value).toBe('female');
      expect(component.selectedNationality()?.value).toBe('de');
      expect(component.selectedLanguage()?.value).toBe('de');
      expect(component.birthday()).toBe('1990-01-01');
    });
  });
});
