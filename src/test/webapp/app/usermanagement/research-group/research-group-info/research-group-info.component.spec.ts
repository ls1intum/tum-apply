import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ResearchGroupInfoComponent } from 'app/usermanagement/research-group/research-group-info/research-group-info.component';
import { User } from 'app/core/auth/account.service';
import { ResearchGroupDTO } from 'app/generated/model/research-group-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideAccountServiceMock, createAccountServiceMock, AccountServiceMock } from 'util/account.service.mock';
import {
  provideResearchGroupResourceApiMock,
  createResearchGroupResourceApiMock,
  ResearchGroupResourceApiMock,
} from 'util/research-group-resource-api.service.mock';
import { provideHttpClientMock } from 'util/http-client.mock';

describe('ResearchGroupInfoComponent', () => {
  let component: ResearchGroupInfoComponent;
  let fixture: ComponentFixture<ResearchGroupInfoComponent>;
  let mockResearchGroupApi: ResearchGroupResourceApiMock;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockAccountService: AccountServiceMock;

  const mockResearchGroupData: ResearchGroupDTO = {
    name: 'Test Research Group',
    abbreviation: 'TRG',
    head: 'Dr. John Doe',
    website: 'https://test.com',
    email: 'test@example.com',
    city: 'Munich',
    postalCode: '80333',
    street: 'Test Street 123',
    description: 'Test description',
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    researchGroup: {
      researchGroupId: 'rg-1',
      name: 'Test Research Group',
    },
  };

  beforeEach(async () => {
    mockResearchGroupApi = createResearchGroupResourceApiMock();
    mockToastService = createToastServiceMock();
    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set(undefined);

    await TestBed.configureTestingModule({
      imports: [ResearchGroupInfoComponent],
      providers: [
        provideResearchGroupResourceApiMock(mockResearchGroupApi),
        provideAccountServiceMock(mockAccountService),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideHttpClientMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupInfoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should require name and head fields', () => {
      const nameControl = component.form.controls.name;
      const headControl = component.form.controls.head;

      nameControl.setValue('');
      headControl.setValue('');
      expect(nameControl.hasError('required')).toBe(true);
      expect(headControl.hasError('required')).toBe(true);

      nameControl.setValue('Test Name');
      headControl.setValue('Test Head');
      expect(nameControl.hasError('required')).toBe(false);
      expect(headControl.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const emailControl = component.form.controls.email;

      emailControl.setValue('invalid-email');
      expect(emailControl.valid).toBe(false);

      emailControl.setValue('valid@example.com');
      expect(emailControl.valid).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should load research group data and populate form when user is available', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupApi.getResearchGroup).toHaveBeenCalledWith('rg-1');
      expect(component.form.value).toEqual({
        name: mockResearchGroupData.name,
        abbreviation: mockResearchGroupData.abbreviation,
        head: mockResearchGroupData.head,
        website: mockResearchGroupData.website,
        email: mockResearchGroupData.email,
        city: mockResearchGroupData.city,
        postalCode: mockResearchGroupData.postalCode,
        address: mockResearchGroupData.street,
        description: mockResearchGroupData.description,
      });
    });

    it.each([
      { description: 'no research group', user: () => Object.assign({}, mockUser, { researchGroup: undefined }) },
      {
        description: 'empty research group id',
        user: () => Object.assign({}, mockUser, { researchGroup: Object.assign({}, mockUser.researchGroup, { researchGroupId: '' }) }),
      },
    ])('should not initialize when user has $description', async ({ user }) => {
      mockAccountService.user.set(user());

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupApi.getResearchGroup).not.toHaveBeenCalled();
    });

    it('should show error toast when loading fails', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'researchGroup.groupInfo.toasts.loadFailed',
        detail: 'researchGroup.groupInfo.toasts.loadFailed',
      });
    });

    it('should only initialize once even if effect runs multiple times', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

      mockAccountService.user.set(mockUser);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupApi.getResearchGroup).toHaveBeenCalledOnce();

      mockAccountService.user.set(Object.assign({}, mockUser));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupApi.getResearchGroup).toHaveBeenCalledOnce();
    });
  });

  describe('Save', () => {
    it('should save research group data successfully', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: 'Updated Name', head: 'Updated Head' });

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          name: 'Updated Name',
          head: 'Updated Head',
          abbreviation: mockResearchGroupData.abbreviation,
        }),
      );
      expect(mockToastService.showSuccess).toHaveBeenCalledWith({ detail: 'researchGroup.groupInfo.toasts.updated' });
      expect(component.isSaving()).toBe(false);
    });

    it('should not save when form is invalid', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: '', head: '' });

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).not.toHaveBeenCalled();
    });

    it('should set isSaving to true during save operation', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(
        new Promise(resolve => setTimeout(() => resolve(mockResearchGroupData), 100)),
      );
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: 'Updated Name', head: 'Updated Head' });

      const savePromise = component.onSave();
      expect(component.isSaving()).toBe(true);

      await savePromise;
      expect(component.isSaving()).toBe(false);
    });

    it('should show error when saving without research group id', async () => {
      mockAccountService.user.set(Object.assign({}, mockUser, { researchGroup: undefined }));

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: 'Test Name', head: 'Test Head' });

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).not.toHaveBeenCalled();
      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'researchGroup.groupInfo.toasts.saveFailed',
        detail: 'researchGroup.groupInfo.toasts.noId',
      });
    });

    it('should show error toast when save fails', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: 'Updated Name', head: 'Updated Head' });

      await component.onSave();

      expect(mockToastService.showError).toHaveBeenCalledWith({ detail: 'researchGroup.groupInfo.toasts.saveFailed' });
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Data Mapping', () => {
    it('should map street field between form address and DTO street', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(Object.assign({}, mockResearchGroupData, { street: 'Test Street' })));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.form.value.address).toBe('Test Street');

      component.form.patchValue({ address: 'New Street' });

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).toHaveBeenCalledWith('rg-1', expect.objectContaining({ street: 'New Street' }));
    });

    it('should default undefined optional fields to empty strings on save', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of({ name: 'Test', head: 'Test Head' }));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          abbreviation: '',
          website: '',
          email: '',
          city: '',
          postalCode: '',
          street: '',
          description: '',
        }),
      );
    });

    it('should default null name and head to empty strings on save', async () => {
      mockResearchGroupApi.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupApi.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({ name: null, head: null });
      component.form.controls.name.clearValidators();
      component.form.controls.head.clearValidators();
      component.form.controls.name.updateValueAndValidity();
      component.form.controls.head.updateValueAndValidity();

      await component.onSave();

      expect(mockResearchGroupApi.updateResearchGroup).toHaveBeenCalledWith('rg-1', expect.objectContaining({ name: '', head: '' }));
    });
  });
});
