import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import { ResearchGroupDetailViewComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-detail-view/research-group-detail-view.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideDynamicDialogConfigMock } from 'util/dynamicdialogref.mock';

describe('ResearchGroupDetailViewComponent', () => {
  let component: ResearchGroupDetailViewComponent;
  let fixture: ComponentFixture<ResearchGroupDetailViewComponent>;
  let mockResearchGroupService: {
    getResearchGroup: ReturnType<typeof vi.fn>;
    updateResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ToastServiceMock;
  let mockDialogConfig: DynamicDialogConfig;

  const mockResearchGroupData: ResearchGroupDTO = {
    name: 'AI Research Lab',
    abbreviation: 'ARL',
    head: 'Prof. Dr. Smith',
    email: 'ai.lab@example.com',
    website: 'https://ai-lab.example.com',
    school: 'Computer Science',
    description: 'Leading AI research',
    street: 'Main Street 1',
    postalCode: '12345',
    city: 'Munich',
    defaultFieldOfStudies: 'Artificial Intelligence',
  };

  beforeEach(async () => {
    mockResearchGroupService = {
      getResearchGroup: vi.fn(),
      updateResearchGroup: vi.fn(),
    };

    mockToastService = createToastServiceMock();

    mockDialogConfig = {
      data: {
        researchGroupId: 'rg-123',
      },
    };

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDetailViewComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        provideDynamicDialogConfigMock(mockDialogConfig),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupDetailViewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.value).toEqual({
      abbreviation: '',
      name: '',
      school: '',
      defaultFieldOfStudies: '',
      head: '',
      email: '',
      website: '',
      description: '',
      city: '',
      postalCode: '',
      street: '',
    });
  });

  it('should compute researchGroupId from dialog config', () => {
    expect(component.researchGroupId()).toBe('rg-123');
  });

  it('should handle undefined researchGroupId in dialog config', () => {
    mockDialogConfig.data = undefined;
    expect(component.researchGroupId()).toBeUndefined();
  });

  it('should load research group data on init', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    await component.ngOnInit();

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('rg-123');
    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
    expect(component.form.value.name).toBe('AI Research Lab');
    expect(component.form.value.abbreviation).toBe('ARL');
    expect(component.form.value.head).toBe('Prof. Dr. Smith');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle error when loading research group fails', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.ngOnInit();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.view');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(component.isLoading()).toBe(false);
  });

  it('should not load data when researchGroupId is undefined', async () => {
    mockDialogConfig.data = undefined;

    await component.ngOnInit();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should not load data when researchGroupId is empty string', async () => {
    mockDialogConfig.data = { researchGroupId: '' };

    await component.ngOnInit();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should not load data when researchGroupId is whitespace', async () => {
    mockDialogConfig.data = { researchGroupId: '   ' };

    await component.ngOnInit();

    expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should populate form with all fields from research group data', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

    await component.ngOnInit();

    expect(component.form.value).toEqual({
      name: 'AI Research Lab',
      abbreviation: 'ARL',
      head: 'Prof. Dr. Smith',
      email: 'ai.lab@example.com',
      website: 'https://ai-lab.example.com',
      school: 'Computer Science',
      description: 'Leading AI research',
      street: 'Main Street 1',
      postalCode: '12345',
      city: 'Munich',
      defaultFieldOfStudies: 'Artificial Intelligence',
    });
  });

  it('should not save when form is invalid', async () => {
    component.form.patchValue({ name: '', head: '' }); // Required fields empty

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(false);
  });

  it('should show error when saving without researchGroupId', async () => {
    mockDialogConfig.data = undefined;
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
  });

  it('should show error when saving with null researchGroupId', async () => {
    mockDialogConfig.data = { researchGroupId: null as unknown as string };
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
  });

  it('should show error when saving with empty researchGroupId', async () => {
    mockDialogConfig.data = { researchGroupId: '' };
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
  });

  it('should show error when saving with whitespace researchGroupId', async () => {
    mockDialogConfig.data = { researchGroupId: '   ' };
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
    expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
  });

  it('should save research group successfully', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(void 0));
    component.form.patchValue({
      name: 'Updated Lab',
      abbreviation: 'UL',
      head: 'Prof. Dr. Jones',
      email: 'updated@example.com',
      website: 'https://updated.com',
      school: 'Engineering',
      description: 'Updated description',
      street: 'New Street 2',
      postalCode: '54321',
      city: 'Berlin',
      defaultFieldOfStudies: 'Machine Learning',
    });

    await component.onSave();

    expect(component.isSaving()).toBe(false);
    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith('rg-123', {
      name: 'Updated Lab',
      abbreviation: 'UL',
      head: 'Prof. Dr. Jones',
      email: 'updated@example.com',
      website: 'https://updated.com',
      school: 'Engineering',
      description: 'Updated description',
      street: 'New Street 2',
      postalCode: '54321',
      city: 'Berlin',
      defaultFieldOfStudies: 'Machine Learning',
    });
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.detailView.success.updated');
  });

  it('should handle error when saving fails', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.save');
    expect(component.isSaving()).toBe(false);
  });

  it('should set isSaving to true during save operation', async () => {
    let isSavingDuringSave = false;
    mockResearchGroupService.updateResearchGroup.mockImplementation(() => {
      isSavingDuringSave = component.isSaving();
      return of(void 0);
    });
    component.form.patchValue({ name: 'Test', head: 'Test Head' });

    await component.onSave();

    expect(isSavingDuringSave).toBe(true);
    expect(component.isSaving()).toBe(false);
  });

  it('should validate email format', () => {
    component.form.patchValue({ email: 'invalid-email' });
    expect(component.form.controls.email.invalid).toBe(true);

    component.form.patchValue({ email: 'valid@example.com' });
    expect(component.form.controls.email.valid).toBe(true);
  });

  it('should require email to have domain with at least 2 characters after dot', () => {
    component.form.patchValue({ email: 'test@example.c' });
    expect(component.form.controls.email.invalid).toBe(true);

    component.form.patchValue({ email: 'test@example.co' });
    expect(component.form.controls.email.valid).toBe(true);
  });

  it('should require name field', () => {
    component.form.patchValue({ name: '' });
    expect(component.form.controls.name.invalid).toBe(true);

    component.form.patchValue({ name: 'Test Lab' });
    expect(component.form.controls.name.valid).toBe(true);
  });

  it('should require head field', () => {
    component.form.patchValue({ head: '' });
    expect(component.form.controls.head.invalid).toBe(true);

    component.form.patchValue({ head: 'Prof. Test' });
    expect(component.form.controls.head.valid).toBe(true);
  });

  it('should handle partial data when populating form', async () => {
    const partialData: ResearchGroupDTO = {
      name: 'Partial Lab',
      head: 'Prof. Partial',
    };
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(partialData));

    await component.ngOnInit();

    expect(component.form.value.name).toBe('Partial Lab');
    expect(component.form.value.head).toBe('Prof. Partial');
    expect(component.form.value.abbreviation).toBe('');
    expect(component.form.value.email).toBe('');
  });

  it('should handle undefined data returned from service', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of(undefined));

    await component.ngOnInit();

    expect(component.form.value).toEqual({
      abbreviation: '',
      name: '',
      school: '',
      defaultFieldOfStudies: '',
      head: '',
      email: '',
      website: '',
      description: '',
      city: '',
      postalCode: '',
      street: '',
    });
  });

  it('should convert null form values to empty strings when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(void 0));
    component.form.patchValue({
      name: 'Test Lab',
      head: 'Prof. Test',
      abbreviation: null,
      email: null,
      website: null,
      school: null,
      description: null,
      street: null,
      postalCode: null,
      city: null,
      defaultFieldOfStudies: null,
    });

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
      'rg-123',
      expect.objectContaining({
        name: 'Test Lab',
        head: 'Prof. Test',
        abbreviation: '',
        email: '',
        website: '',
        school: '',
        description: '',
        street: '',
        postalCode: '',
        city: '',
        defaultFieldOfStudies: '',
      }),
    );
  });

  it('should handle null values for required fields when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(void 0));

    // Clear validators to allow null values to pass the form.valid check
    component.form.controls.name.clearValidators();
    component.form.controls.name.updateValueAndValidity();
    component.form.controls.head.clearValidators();
    component.form.controls.head.updateValueAndValidity();

    component.form.patchValue({
      name: null,
      head: null,
    });

    await component.onSave();

    expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
      'rg-123',
      expect.objectContaining({
        name: '',
        head: '',
      }),
    );
  });
});
