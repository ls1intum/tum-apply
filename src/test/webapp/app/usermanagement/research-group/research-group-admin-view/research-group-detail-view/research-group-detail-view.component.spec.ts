import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import { Router } from '@angular/router';

import { ResearchGroupDetailViewComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-detail-view/research-group-detail-view.component';
import { ResearchGroupResourceApi } from 'app/generated/api/research-group-resource-api';
import { DepartmentResourceApi } from 'app/generated/api/department-resource-api';
import { ResearchGroupDTO } from 'app/generated/model/research-group-dto';
import { DepartmentDTO } from 'app/generated/model/department-dto';
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
  let mockDepartmentService: { getDepartments: ReturnType<typeof vi.fn> };
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
        { provide: ResearchGroupResourceApi, useValue: mockResearchGroupService },
        { provide: DepartmentResourceApi, useValue: mockDepartmentService },
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
    it('should load research group data on init', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of(mockResearchGroupData));

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('rg-123');
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
      });
    });

    it('should show error toast when loading fails', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

      await component.ngOnInit();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.view');
    });

    it.each<{ description: string; params: Record<string, string> }>([
      { description: 'undefined', params: {} },
      { description: 'empty string', params: { researchGroupId: '' } },
      { description: 'whitespace', params: { researchGroupId: '   ' } },
    ])('should not load data when researchGroupId is $description', async ({ params }) => {
      mockActivatedRoute.setParams(params);

      await component.ngOnInit();

      expect(mockResearchGroupService.getResearchGroup).not.toHaveBeenCalled();
    });
  });

  describe('saving', () => {
    it('should not save when form is invalid', async () => {
      component.form.patchValue({ name: '', head: '' });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).not.toHaveBeenCalled();
    });

    it.each<{ description: string; params: Record<string, string> }>([
      { description: 'no params', params: {} },
      { description: 'whitespace', params: { researchGroupId: '   ' } },
    ])('should show error when saving with $description researchGroupId', async ({ params }) => {
      mockActivatedRoute.setParams(params);
      component.form.patchValue({ name: 'Test', head: 'Test Head', departmentId: 'dept-1' });

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
        departmentId: 'dept-2',
        description: 'Updated description',
        street: 'New Street 2',
        postalCode: '54321',
        city: 'Berlin',
      });

      await component.onSave();

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
      });
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.detailView.success.updated');
    });

    it('should show error toast when saving fails', async () => {
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
      });

      await component.onSave();

      expect(mockResearchGroupService.updateResearchGroup).toHaveBeenCalledWith(
        'rg-123',
        expect.objectContaining({
          abbreviation: '',
          email: '',
          website: '',
          description: '',
          street: '',
          postalCode: '',
          city: '',
        }),
      );
    });
  });

  describe('validation', () => {
    it.each([
      { field: 'email', invalid: 'invalid-email', valid: 'valid@example.com' },
      { field: 'email', invalid: 'test@example.c', valid: 'test@example.co' },
      { field: 'name', invalid: '', valid: 'Test Lab' },
      { field: 'head', invalid: '', valid: 'Prof. Test' },
    ] as const)('should validate $field', ({ field, invalid, valid }) => {
      component.form.patchValue({ [field]: invalid });
      expect(component.form.controls[field].invalid).toBe(true);

      component.form.patchValue({ [field]: valid });
      expect(component.form.controls[field].valid).toBe(true);
    });
  });

  describe('departments', () => {
    it('should populate form with empty fields for partial data', async () => {
      mockResearchGroupService.getResearchGroup.mockReturnValue(of({ name: 'Partial Lab', head: 'Prof. Partial' }));

      await component.ngOnInit();

      expect(component.form.value.name).toBe('Partial Lab');
      expect(component.form.value.abbreviation).toBe('');
      expect(component.form.value.email).toBe('');
    });

    it('should show error toast when loading departments fails', async () => {
      mockDepartmentService.getDepartments.mockReturnValue(throwError(() => new Error('API Error')));

      await component.loadDepartments();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.detailView.errors.loadDepartments');
    });

    it('should update selectedDepartmentId and form value on department change', () => {
      component.onDepartmentChange({ name: 'Physics', value: 'dept-2' });

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

    it('should default missing department fields to empty strings in options', () => {
      component.departments.set([{ departmentId: undefined, name: undefined }]);

      expect(component.departmentOptions()).toEqual([{ name: '', value: '' }]);
    });
  });
});
