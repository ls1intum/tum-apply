import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ResearchGroupInfoComponent } from 'app/usermanagement/research-group/research-group-info/research-group-info.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { ResearchGroupShortDTO } from 'app/generated/model/researchGroupShortDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';

describe('ResearchGroupInfoComponent', () => {
  let component: ResearchGroupInfoComponent;
  let fixture: ComponentFixture<ResearchGroupInfoComponent>;
  let mockResearchGroupService: {
    getResearchGroup: ReturnType<typeof vi.fn>;
    updateResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockAccountService: {
    loadedUser: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ReturnType<typeof createToastServiceMock>;

  const mockResearchGroupShort: ResearchGroupShortDTO = {
    researchGroupId: 'research-group-1',
    name: 'Test Research Group',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    researchGroup: mockResearchGroupShort,
    authorities: ['ROLE_PROFESSOR'],
  };

  const mockResearchGroupData: ResearchGroupDTO = {
    name: 'Test Research Group',
    abbreviation: 'TRG',
    head: 'Prof. Test Head',
    email: 'group@example.com',
    website: 'https://example.com',
    school: 'Test School',
    description: 'Test description',
    defaultFieldOfStudies: 'Computer Science',
    street: '123 Test Street',
    postalCode: '12345',
    city: 'Test City',
  };

  beforeEach(async () => {
    mockResearchGroupService = {
      getResearchGroup: vi.fn(),
      updateResearchGroup: vi.fn(),
    };

    mockAccountService = {
      loadedUser: vi.fn().mockReturnValue(mockUser),
    };

    mockToastService = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupInfoComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: AccountService, useValue: mockAccountService },
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupInfoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isSaving()).toBe(false);
    expect(component.hasInitialized()).toBe(false);
    expect(component.form).toBeDefined();
  });

  it('should have correct form structure with validators', () => {
    const form = component.form;

    expect(form.get('name')).toBeDefined();
    expect(form.get('name')?.hasError('required')).toBe(true);

    expect(form.get('abbreviation')).toBeDefined();

    expect(form.get('head')).toBeDefined();
    expect(form.get('head')?.hasError('required')).toBe(true);

    expect(form.get('school')).toBeDefined();
    expect(form.get('website')).toBeDefined();

    expect(form.get('email')).toBeDefined();
    form.get('email')?.setValue('invalid-email');
    expect(form.get('email')?.hasError('email')).toBe(true);

    expect(form.get('city')).toBeDefined();
    expect(form.get('postalCode')).toBeDefined();
    expect(form.get('address')).toBeDefined();
    expect(form.get('description')).toBeDefined();
    expect(form.get('defaultFieldOfStudies')).toBeDefined();
  });

  it('should compute research group ID from current user', () => {
    fixture.detectChanges();

    expect(component.researchGroupId()).toBe('research-group-1');
  });

  it('should return undefined research group ID when user has no research group', () => {
    mockAccountService.loadedUser.mockReturnValue({ ...mockUser, researchGroup: undefined });
    fixture.detectChanges();

    expect(component.researchGroupId()).toBeUndefined();
  });

  it('should initialize and load research group data when user becomes available', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('research-group-1');
    expect(component.hasInitialized()).toBe(true);
    expect(component.form.get('name')?.value).toBe('Test Research Group');
    expect(component.form.get('abbreviation')?.value).toBe('TRG');
    expect(component.form.get('head')?.value).toBe('Prof. Test Head');
    expect(component.form.get('email')?.value).toBe('group@example.com');
    expect(component.form.get('website')?.value).toBe('https://example.com');
    expect(component.form.get('school')?.value).toBe('Test School');
    expect(component.form.get('description')?.value).toBe('Test description');
    expect(component.form.get('defaultFieldOfStudies')?.value).toBe('Computer Science');
    expect(component.form.get('address')?.value).toBe('123 Test Street');
    expect(component.form.get('postalCode')?.value).toBe('12345');
    expect(component.form.get('city')?.value).toBe('Test City');
  });

  it('should handle initialization when no research group ID is available', async () => {
    mockAccountService.loadedUser.mockReturnValue({ ...mockUser, researchGroup: undefined });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(true);
  });

  it('should handle initialization when research group ID is empty string', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: '' },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(true);
  });

  it('should handle initialization when research group ID is null in init method', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: null as any },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(true);
  });

  it('should handle initialization when research group ID is whitespace only in init method', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: '   ' },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(true);
  });

  it('should handle error during initialization and show error toast', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('research-group-1');
    expect(mockToastService.showError).toHaveBeenCalledWith({
      summary: 'researchGroup.groupInfo.toasts.loadFailed',
      detail: 'researchGroup.groupInfo.toasts.loadFailed',
    });
    expect(component.hasInitialized()).toBe(true);
  });

  it('should not save when form is invalid', async () => {
    component.form.get('name')?.setValue('');
    component.form.get('head')?.setValue('');

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(false);
  });

  it('should not save when research group ID is null', async () => {
    mockAccountService.loadedUser.mockReturnValue({ ...mockUser, researchGroup: undefined });
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(mockToastService.showError).toHaveBeenCalledWith({
      summary: 'researchGroup.groupInfo.toasts.saveFailed',
      detail: 'researchGroup.groupInfo.toasts.noId',
    });
  });

  it('should not save when research group ID is empty string', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: '   ' },
    });
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(mockToastService.showError).toHaveBeenCalledWith({
      summary: 'researchGroup.groupInfo.toasts.saveFailed',
      detail: 'researchGroup.groupInfo.toasts.noId',
    });
  });

  it('should not save when research group ID is exactly null', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: null as any },
    });
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(mockToastService.showError).toHaveBeenCalledWith({
      summary: 'researchGroup.groupInfo.toasts.saveFailed',
      detail: 'researchGroup.groupInfo.toasts.noId',
    });
  });

  it('should not save when research group ID is empty string (not just whitespace)', async () => {
    mockAccountService.loadedUser.mockReturnValue({
      ...mockUser,
      researchGroup: { ...mockResearchGroupShort, researchGroupId: '' },
    });
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(mockToastService.showError).toHaveBeenCalledWith({
      summary: 'researchGroup.groupInfo.toasts.saveFailed',
      detail: 'researchGroup.groupInfo.toasts.noId',
    });
  });

  it('should save successfully with valid form data', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // Set valid form data
    component.form.patchValue({
      name: 'Updated Name',
      abbreviation: 'UN',
      head: 'Updated Head',
      email: 'updated@example.com',
      website: 'https://updated.com',
      school: 'Updated School',
      description: 'Updated description',
      defaultFieldOfStudies: 'Updated Field',
      address: 'Updated Address',
      postalCode: '54321',
      city: 'Updated City',
    });

    await component.onSave();

    expect(component.isSaving()).toBe(false);
    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('research-group-1', {
      name: 'Updated Name',
      abbreviation: 'UN',
      head: 'Updated Head',
      email: 'updated@example.com',
      website: 'https://updated.com',
      school: 'Updated School',
      description: 'Updated description',
      defaultFieldOfStudies: 'Updated Field',
      street: 'Updated Address',
      postalCode: '54321',
      city: 'Updated City',
    });
    expect(mockToastService.showSuccess).toHaveBeenCalledWith({
      detail: 'researchGroup.groupInfo.toasts.updated',
    });
  });

  it('should handle null/undefined form values when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // Set only required fields
    component.form.patchValue({
      name: 'Required Name',
      head: 'Required Head',
      abbreviation: null,
      email: null,
      website: null,
      school: null,
      description: null,
      defaultFieldOfStudies: null,
      address: null,
      postalCode: null,
      city: null,
    });

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('research-group-1', {
      name: 'Required Name',
      abbreviation: '',
      head: 'Required Head',
      email: '',
      website: '',
      school: '',
      description: '',
      defaultFieldOfStudies: '',
      street: '',
      postalCode: '',
      city: '',
    });
  });

  it('should handle undefined form values when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // Set form values to undefined explicitly
    component.form.patchValue({
      name: 'Required Name',
      head: 'Required Head',
      abbreviation: undefined,
      email: undefined,
      website: undefined,
      school: undefined,
      description: undefined,
      defaultFieldOfStudies: undefined,
      address: undefined,
      postalCode: undefined,
      city: undefined,
    });

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('research-group-1', {
      name: 'Required Name',
      abbreviation: '',
      head: 'Required Head',
      email: '',
      website: '',
      school: '',
      description: '',
      defaultFieldOfStudies: '',
      street: '',
      postalCode: '',
      city: '',
    });
  });

  it('should handle form values that are exactly null when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // Set valid required fields first
    component.form.get('name')?.setValue('Required Name');
    component.form.get('head')?.setValue('Required Head');

    // Directly manipulate the form's value to have null values
    // This tests the exact ?? operator branches
    const formValue = {
      name: 'Required Name',
      head: 'Required Head',
      abbreviation: null,
      email: null,
      website: null,
      school: null,
      description: null,
      defaultFieldOfStudies: null,
      address: null,
      postalCode: null,
      city: null,
    };

    // Mock both the form.value getter and form.valid getter
    vi.spyOn(component.form, 'value', 'get').mockReturnValue(formValue);
    vi.spyOn(component.form, 'valid', 'get').mockReturnValue(true);

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('research-group-1', {
      name: 'Required Name',
      abbreviation: '',
      head: 'Required Head',
      email: '',
      website: '',
      school: '',
      description: '',
      defaultFieldOfStudies: '',
      street: '',
      postalCode: '',
      city: '',
    });
  });

  it('should handle null required fields in form value (edge case for 100% branch coverage)', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // This test specifically targets lines 107 and 109 - the ?? operators for required fields
    // In a real scenario, this shouldn't happen, but we need to test the fallback branches
    const formValue = {
      name: null, // This tests line 107: formValue.name ?? ''
      head: null, // This tests line 109: formValue.head ?? ''
      abbreviation: 'Test Abbr',
      email: 'test@example.com',
      website: 'https://example.com',
      school: 'Test School',
      description: 'Test Description',
      defaultFieldOfStudies: 'Computer Science',
      address: 'Test Address',
      postalCode: '12345',
      city: 'Test City',
    };

    // Mock both the form.value getter and form.valid getter
    vi.spyOn(component.form, 'value', 'get').mockReturnValue(formValue);
    vi.spyOn(component.form, 'valid', 'get').mockReturnValue(true);

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('research-group-1', {
      name: '', // fallback from null
      abbreviation: 'Test Abbr',
      head: '', // fallback from null
      email: 'test@example.com',
      website: 'https://example.com',
      school: 'Test School',
      description: 'Test Description',
      defaultFieldOfStudies: 'Computer Science',
      street: 'Test Address',
      postalCode: '12345',
      city: 'Test City',
    });
  });

  it('should set isSaving to true during save operation', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(mockResearchGroupData));
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    const savePromise = component.onSave();

    expect(component.isSaving()).toBe(true);

    await savePromise;

    expect(component.isSaving()).toBe(false);
  });

  it('should handle error during save and show error toast', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(throwError(() => new Error('Save Error')));
    component.form.get('name')?.setValue('Valid Name');
    component.form.get('head')?.setValue('Valid Head');

    await component.onSave();

    expect(component.isSaving()).toBe(false);
    expect(mockToastService.showError).toHaveBeenCalledWith({
      detail: 'researchGroup.groupInfo.toasts.saveFailed',
    });
  });

  it('should validate email format correctly', () => {
    const emailControl = component.form.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('test@invalid');
    expect(emailControl?.hasError('pattern')).toBe(true);

    emailControl?.setValue('test@example.com');
    expect(emailControl?.valid).toBe(true);

    emailControl?.setValue('');
    expect(emailControl?.valid).toBe(true); // Email is optional
  });

  it('should populate form data correctly with partial data', () => {
    const partialData: ResearchGroupDTO = {
      name: 'Partial Name',
      head: 'Partial Head',
      email: 'partial@example.com',
    };

    component['populateFormData'](partialData);

    expect(component.form.get('name')?.value).toBe('Partial Name');
    expect(component.form.get('head')?.value).toBe('Partial Head');
    expect(component.form.get('email')?.value).toBe('partial@example.com');
    expect(component.form.get('abbreviation')?.value).toBeUndefined();
    expect(component.form.get('website')?.value).toBeUndefined();
  });

  it('should populate form data correctly with undefined data', () => {
    component['populateFormData'](undefined);

    expect(component.form.get('name')?.value).toBeUndefined();
    expect(component.form.get('head')?.value).toBeUndefined();
    expect(component.form.get('email')?.value).toBeUndefined();
  });

  it('should not initialize multiple times', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // First initialization
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hasInitialized()).toBe(true);
    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);

    // Trigger effect again - should not initialize again
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should not initialize when user exists but component is already initialized', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    // Manually set hasInitialized to true before triggering effect
    component.hasInitialized.set(true);

    fixture.detectChanges();
    await fixture.whenStable();

    // Should not call getResearchGroup because hasInitialized is already true
    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(true);
  });

  it('should handle effect when currentUser is falsy', async () => {
    mockAccountService.loadedUser.mockReturnValue(null);
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    fixture.detectChanges();
    await fixture.whenStable();

    // Should not call init because currentUser is falsy
    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.hasInitialized()).toBe(false);
  });

  it('should handle effect when currentUser changes from null to valid user', async () => {
    // This test verifies that the effect condition works correctly
    // Since effects are hard to test with changing mocks, we'll test the logic indirectly
    mockAccountService.loadedUser.mockReturnValue(null);
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hasInitialized()).toBe(false);
    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();

    // The effect logic is tested in other tests where we start with a valid user
    // This test primarily verifies the null user case doesn't trigger initialization
  });

  it('should handle user becoming available after component creation', async () => {
    // Start with no user
    mockAccountService.loadedUser.mockReturnValue(undefined);
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hasInitialized()).toBe(false);
    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();

    // User becomes available - need to create a new component with the updated user
    TestBed.resetTestingModule();
    mockAccountService.loadedUser.mockReturnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [ResearchGroupInfoComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: AccountService, useValue: mockAccountService },
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
      ],
    }).compileComponents();

    const newFixture = TestBed.createComponent(ResearchGroupInfoComponent);
    const newComponent = newFixture.componentInstance;

    newFixture.detectChanges();
    await newFixture.whenStable();

    expect(newComponent.hasInitialized()).toBe(true);
    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('research-group-1');
  });
});
