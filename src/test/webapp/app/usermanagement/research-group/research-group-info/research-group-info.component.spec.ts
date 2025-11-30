import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ResearchGroupInfoComponent } from 'app/usermanagement/research-group/research-group-info/research-group-info.component';
import { User } from 'app/core/auth/account.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideAccountServiceMock, createAccountServiceMock, AccountServiceMock } from 'util/account.service.mock';
import {
  provideResearchGroupResourceApiServiceMock,
  createResearchGroupResourceApiServiceMock,
  ResearchGroupResourceApiServiceMock,
} from 'util/research-group-resource-api.service.mock';
import { provideHttpClientMock } from 'util/http-client.mock';

describe('ResearchGroupInfoComponent', () => {
  let component: ResearchGroupInfoComponent;
  let fixture: ComponentFixture<ResearchGroupInfoComponent>;
  let mockResearchGroupService: ResearchGroupResourceApiServiceMock;
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
    defaultFieldOfStudies: 'Computer Science',
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
    mockResearchGroupService = createResearchGroupResourceApiServiceMock();

    mockToastService = createToastServiceMock();

    mockAccountService = createAccountServiceMock();
    // Initialize with undefined user by default
    mockAccountService.user.set(undefined);

    await TestBed.configureTestingModule({
      imports: [ResearchGroupInfoComponent],
      providers: [
        provideResearchGroupResourceApiServiceMock(mockResearchGroupService),
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

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isSaving()).toBe(false);
      expect(component.hasInitialized()).toBe(false);
      expect(component.form).toBeTruthy();
    });
  });

  describe('Form Structure and Validation', () => {
    it('should have form with all required controls', () => {
      expect(component.form.controls.name).toBeTruthy();
      expect(component.form.controls.abbreviation).toBeTruthy();
      expect(component.form.controls.head).toBeTruthy();
      expect(component.form.controls.website).toBeTruthy();
      expect(component.form.controls.email).toBeTruthy();
      expect(component.form.controls.city).toBeTruthy();
      expect(component.form.controls.postalCode).toBeTruthy();
      expect(component.form.controls.address).toBeTruthy();
      expect(component.form.controls.description).toBeTruthy();
      expect(component.form.controls.defaultFieldOfStudies).toBeTruthy();
    });

    it('should have required validators on name and head fields', () => {
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

    it('should have email validator on email field', () => {
      const emailControl = component.form.controls.email;

      emailControl.setValue('invalid-email');
      expect(emailControl.valid).toBe(false);

      emailControl.setValue('valid@example.com');
      expect(emailControl.valid).toBe(true);
    });
  });

  describe('User and Research Group ID', () => {
    it('should compute researchGroupId from current user', () => {
      mockAccountService.user.set(mockUser);
      fixture.detectChanges();

      expect(component.researchGroupId()).toBe('rg-1');
    });

    it('should return undefined researchGroupId when user has no research group', () => {
      mockAccountService.user.set({ ...mockUser, researchGroup: undefined });
      fixture.detectChanges();

      expect(component.researchGroupId()).toBeUndefined();
    });
  });

  describe('Data Loading', () => {
    it('should initialize and load research group data when user is available', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('rg-1');
      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
      expect(component.hasInitialized()).toBe(true);
    });

    it('should populate form with loaded research group data', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

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
        defaultFieldOfStudies: mockResearchGroupData.defaultFieldOfStudies,
      });
    });

    it('should not initialize when user has no research group id', async () => {
      mockAccountService.user.set({ ...mockUser, researchGroup: undefined });

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
      expect(component.hasInitialized()).toBe(true);
    });

    it('should not initialize when research group id is empty string', async () => {
      mockAccountService.user.set({
        ...mockUser,
        researchGroup: { ...mockUser.researchGroup, researchGroupId: '' },
      });

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
      expect(component.hasInitialized()).toBe(true);
    });

    it('should handle error when loading research group data fails', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'researchGroup.groupInfo.toasts.loadFailed',
        detail: 'researchGroup.groupInfo.toasts.loadFailed',
      });
      expect(mockToastService.showError).toHaveBeenCalledTimes(1);
      expect(component.hasInitialized()).toBe(true);
    });

    it('should only initialize once even if effect runs multiple times', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

      // First set user
      mockAccountService.user.set(mockUser);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
      expect(component.hasInitialized()).toBe(true);

      // Trigger effect again by updating signal
      mockAccountService.user.set({ ...mockUser });
      fixture.detectChanges();
      await fixture.whenStable();

      // Should still only have been called once
      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save Functionality', () => {
    it('should save research group data successfully', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: 'Updated Name',
        head: 'Updated Head',
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          name: 'Updated Name',
          head: 'Updated Head',
          abbreviation: mockResearchGroupData.abbreviation,
          email: mockResearchGroupData.email,
        }),
      );
      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledTimes(1);
      expect(mockToastService.showSuccess).toHaveBeenCalledWith({
        detail: 'researchGroup.groupInfo.toasts.updated',
      });
      expect(mockToastService.showSuccess).toHaveBeenCalledTimes(1);
      expect(component.isSaving()).toBe(false);
    });

    it('should not save when form is invalid', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: '', // Required field is empty
        head: '',
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    });

    it('should set isSaving to true during save operation', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(
        new Promise(resolve => {
          setTimeout(() => resolve(mockResearchGroupData), 100);
        }),
      );
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: 'Updated Name',
        head: 'Updated Head',
      });

      const savePromise = component.onSave();
      expect(component.isSaving()).toBe(true);

      await savePromise;
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should show error when saving without research group id', async () => {
      mockAccountService.user.set({ ...mockUser, researchGroup: undefined });

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: 'Test Name',
        head: 'Test Head',
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'researchGroup.groupInfo.toasts.saveFailed',
        detail: 'researchGroup.groupInfo.toasts.noId',
      });
      expect(mockToastService.showError).toHaveBeenCalledTimes(1);
    });

    it('should show error when saving with empty research group id', async () => {
      mockAccountService.user.set({
        ...mockUser,
        researchGroup: { ...mockUser.researchGroup, researchGroupId: '' },
      });

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: 'Test Name',
        head: 'Test Head',
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'researchGroup.groupInfo.toasts.saveFailed',
        detail: 'researchGroup.groupInfo.toasts.noId',
      });
    });

    it('should handle error when saving research group data fails', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      component.form.patchValue({
        name: 'Updated Name',
        head: 'Updated Head',
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledTimes(1);
      expect(mockToastService.showError).toHaveBeenCalledWith({
        detail: 'researchGroup.groupInfo.toasts.saveFailed',
      });
      expect(mockToastService.showError).toHaveBeenCalledTimes(1);
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Edge Cases and Data Mapping', () => {
    it('should map street field correctly between form and DTO', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of({ ...mockResearchGroupData, street: 'Test Street' }));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      // Check that street was loaded into address field
      expect(component.form.value.address).toBe('Test Street');

      // Update and save
      component.form.patchValue({
        address: 'New Street',
      });

      await component.onSave();

      // Check that address was saved as street
      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          street: 'New Street',
        }),
      );
    });

    it('should handle null values in research group data', async () => {
      const dataWithNulls: ResearchGroupDTO = {
        name: 'Test',
        head: 'Test Head',
      };
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(dataWithNulls));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.form.value.abbreviation).toBeUndefined();
      expect(component.form.value.website).toBeUndefined();
      expect(component.form.value.email).toBeUndefined();
    });

    it('should use empty strings for undefined form values when saving', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of({ name: 'Test', head: 'Test Head' }));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          abbreviation: '',
          website: '',
          email: '',
          city: '',
          postalCode: '',
          street: '',
          description: '',
          defaultFieldOfStudies: '',
        }),
      );
    });

    it('should handle null values for name and head in form when saving', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockAccountService.user.set(mockUser);

      fixture.detectChanges();
      await fixture.whenStable();

      // Manually set name and head to null to test the ?? '' branches
      component.form.patchValue({
        name: null,
        head: null,
      });

      // Disable validators temporarily to allow save with null values
      component.form.controls.name.clearValidators();
      component.form.controls.head.clearValidators();
      component.form.controls.name.updateValueAndValidity();
      component.form.controls.head.updateValueAndValidity();

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
        'rg-1',
        expect.objectContaining({
          name: '',
          head: '',
        }),
      );
    });
  });
});
