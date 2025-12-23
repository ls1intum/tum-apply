import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResearchGroupDepartmentsComponent } from 'app/usermanagement/research-group/research-group-departments/research-group-departments.component';
import { DepartmentResourceApiService } from 'app/generated';
import { DepartmentDTO } from 'app/generated/model/models';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createDialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';

describe('ResearchGroupDepartmentsComponent', () => {
  let component: ResearchGroupDepartmentsComponent;
  let fixture: ComponentFixture<ResearchGroupDepartmentsComponent>;
  let mockDepartmentService: {
    getDepartments: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;

  const mockDepartments: DepartmentDTO[] = [
    {
      departmentId: '1',
      name: 'Dept 1',
      school: { name: 'School 1', abbreviation: 'S1' },
    },
    {
      departmentId: '2',
      name: 'Dept 2',
      school: { name: 'School 2', abbreviation: 'S2' },
    },
  ];

  beforeEach(async () => {
    mockDepartmentService = {
      getDepartments: vi.fn(),
    };
    mockToastService = createToastServiceMock();
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupDepartmentsComponent],
      providers: [
        { provide: DepartmentResourceApiService, useValue: mockDepartmentService },
        provideToastServiceMock(mockToastService),
        provideDialogServiceMock(mockDialogService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupDepartmentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load departments and map them correctly', async () => {
    mockDepartmentService.getDepartments.mockReturnValue(of(mockDepartments));

    // Trigger load
    await component.loadDepartments();
    fixture.detectChanges();

    const tableData = component.tableData();
    expect(tableData.length).toBe(2);
    expect(tableData[0].name).toBe('Dept 1');
    expect(tableData[0].schoolName).toBe('School 1');
    expect(tableData[0].schoolAbbreviation).toBe('S1');
  });
});
