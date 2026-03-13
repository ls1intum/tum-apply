import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import { Router } from '@angular/router';

import { ResearchGroupDetailViewComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-detail-view/research-group-detail-view.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { DepartmentDTO } from 'app/generated/model/departmentDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideRouterMock } from 'util/router.mock';

describe('ResearchGroupDetailViewComponent', () => {
  let component: ResearchGroupDetailViewComponent;
  let fixture: ComponentFixture<ResearchGroupDetailViewComponent>;
  let mockResearchGroupService: {
    getResearchGroup: ReturnType<typeof vi.fn>;
    updateResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockDepartmentService: {
    getDepartments: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ToastServiceMock;
  let mockActivatedRoute: ReturnType<typeof createActivatedRouteMock>;

  const mockResearchGroupData: ResearchGroupDTO = {
    name: 'AI Research Lab',
    abbreviation: 'ARL',
    head: 'Prof. Dr. Smith',
    email: 'ai.lab@example.com',
    website: 'https://ai-lab.example.com',
    departmentId: 'dept-1',
    description: 'Leading AI research',
    street: 'Main Street 1',
    postalCode: '12345',
    city: 'Munich',
    defaultFieldOfStudies: 'Artificial Intelligence',
  };

  const mockDepartments: DepartmentDTO[] = [
    { departmentId: 'dept-1', name: 'Computer Science' },
    { departmentId: 'dept-2', name: 'Physics' },
  ];

  beforeEach(async () => {
    mockResearchGroupService = {
      getResearchGroup: vi.fn(),
      updateResearchGroup: vi.fn(),
    };

    mockDepartmentService = {
      getDepartments: vi.fn().mockReturnValue(of(mockDepartments)),
    };

    mockToastService = createToastServiceMock();

    mockActivatedRoute = createActivatedRouteMock({ researchGroupId: 'rg-123' });

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDetailViewComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: DepartmentResourceApiService, useValue: mockDepartmentService },
        provideActivatedRouteMock(mockActivatedRoute),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideRouterMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupDetailViewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.form.value).toEqual({
        abbreviation: '',
        name: '',
        departmentId: '',
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

    it('should handle undefined researchGroupId in route params', () => {
      mockActivatedRoute.setParams({});
      expect(component.researchGroupId()).toBeUndefined();
    });

    it('should load research group data on init', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('rg-123');
      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledTimes(1);
      expect(mockDepartmentService.getDepartments).toHaveBeenCalledTimes(1);
      expect(component.form.value.name).toBe('AI Research Lab');
      expect(component.form.value.abbreviation).toBe('ARL');
      expect(component.form.value.head).toBe('Prof. Dr. Smith');
      expect(component.form.value.departmentId).toBe('dept-1');
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
      mockActivatedRoute.setParams({});

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should not load data when researchGroupId is empty string', async () => {
      mockActivatedRoute.setParams({ researchGroupId: '' });

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should not load data when researchGroupId is whitespace', async () => {
      mockActivatedRoute.setParams({ researchGroupId: '   ' });

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should populate form with all fields from research group data', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));
      mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

      await component.ngOnInit();

      expect(component.form.value).toEqual({
        name: 'AI Research Lab',
        abbreviation: 'ARL',
        head: 'Prof. Dr. Smith',
        email: 'ai.lab@example.com',
        website: 'https://ai-lab.example.com',
        departmentId: 'dept-1',
        description: 'Leading AI research',
        street: 'Main Street 1',
        postalCode: '12345',
        city: 'Munich',
        defaultFieldOfStudies: 'Artificial Intelligence',
      });
    });
  });

  describe('saving', () => {
    it('should not save when form is invalid', async () => {
      component.form.patchValue({ name: '', head: '' }); // Required fields empty

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    });

    it('should show error when saving without researchGroupId', async () => {
      mockActivatedRoute.setParams({});
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

      await component.onSave();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    });

    it('should show error when saving with null researchGroupId', async () => {
      mockActivatedRoute.setParams({ researchGroupId: '' });
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

      await component.onSave();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    });

    it('should show error when saving with empty researchGroupId', async () => {
      mockActivatedRoute.setParams({ researchGroupId: '' });
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

      await component.onSave();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    });

    it('should show error when saving with whitespace researchGroupId', async () => {
      mockActivatedRoute.setParams({ researchGroupId: '   ' });
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

      await component.onSave();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.noId');
      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    });

    it('should save research group successfully', async () => {
      mockResearchGroupService.updateResearchGroup.mockReturnValue(of(void 0));
      mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

      component.form.patchValue({
        name: 'Updated Lab',
        abbreviation: 'UL',
        head: 'Prof. Dr. Jones',
        email: 'updated@example.com',
        website: 'https://updated.com',
        departmentId: 'dept-2',
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
        departmentId: 'dept-2',
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
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

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
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

      await component.onSave();

      expect(isSavingDuringSave).toBe(true);
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('validation', () => {
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
  });

  describe('loading data', () => {
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
      mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

      await component.ngOnInit();

      expect(component.form.value).toEqual({
        abbreviation: '',
        name: '',
        departmentId: '',
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
  });

  it('should convert null form values to empty strings when saving', async () => {
    mockResearchGroupService.updateResearchGroup.mockReturnValue(of(void 0));
    component.form.patchValue({
      name: 'Test Lab',
      head: 'Prof. Test',
      abbreviation: null,
      email: null,
      website: null,
      departmentId: 'dept-1',
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
    component.form.controls.departmentId.clearValidators();
    component.form.controls.departmentId.updateValueAndValidity();

    component.form.patchValue({
      name: null,
      head: null,
      departmentId: null,
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

  it('should handle error when loading departments fails', async () => {
    mockDepartmentService.getDepartments.mockReturnValue(throwError(() => new Error('API Error')));

    await component.loadDepartments();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.loadDepartments');
  });

  it('should update selectedDepartmentId and form value on department change', () => {
    const option = { name: 'Physics', value: 'dept-2' };
    component.onDepartmentChange(option);

    expect(component.selectedDepartmentId()).toBe('dept-2');
    expect(component.form.value.departmentId).toBe('dept-2');
  });

  it('should compute selectedDepartmentOption correctly', () => {
    component.departments.set(mockDepartments);

    component.selectedDepartmentId.set(undefined);
    expect(component.selectedDepartmentOption()).toBeUndefined();

    component.selectedDepartmentId.set('dept-1');
    expect(component.selectedDepartmentOption()).toEqual({ name: 'Computer Science', value: 'dept-1' });

    component.selectedDepartmentId.set('');
    expect(component.selectedDepartmentOption()).toBeUndefined();
  });

  it('should handle departments with missing name or id in options', () => {
    const incompleteDepartments: DepartmentDTO[] = [{ departmentId: undefined, name: undefined }];
    component.departments.set(incompleteDepartments);

    const options = component.departmentOptions();
    expect(options).toEqual([{ name: '', value: '' }]);
  });
});
