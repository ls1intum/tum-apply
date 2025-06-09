import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';

import { JobResourceService } from '../../../generated';

import { MyPositionsPageComponent } from './my-positions-page.component';

const mockJobs = [
  {
    id: 'abcdef-12345',
    title: 'Doctorate in AI',
    professorName: 'Prof. Turing',
    state: 'PUBLISHED',
    startDate: '2025-09-01',
    createdAt: '2025-06-01',
    lastModifiedAt: '2025-06-08',
  },
  {
    id: 'abcdef-12346',
    title: 'Student Researcher ML',
    professorName: 'Prof. Krusche',
    state: 'DRAFT',
    startDate: '2025-12-01',
    createdAt: '2024-01-01',
    lastModifiedAt: '2025-09-08',
  },
];

class MockJobResourceService {
  getJobsByProfessor = jest.fn().mockReturnValue(
    of({
      content: mockJobs,
      totalElements: 1,
    }),
  );
}

describe('MyPositionsPageComponent', () => {
  let component: MyPositionsPageComponent;
  let fixture: ComponentFixture<MyPositionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent],
      providers: [
        {
          provide: JobResourceService,
          useClass: MockJobResourceService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPositionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs and update jobs and totalRecords', async () => {
    await component['loadJobs']();
    await fixture.whenStable();

    expect(component.jobs()).toEqual(mockJobs);
    expect(component.totalRecords()).toBe(1);
  });

  it('should set pagination correctly in loadOnTableEmit', () => {
    const spy = jest.spyOn(component as unknown as { loadJobs: () => void }, 'loadJobs');
    const event: TableLazyLoadEvent = { first: 20, rows: 10 };
    component.loadOnTableEmit(event);
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should have correct state mappings', () => {
    expect(component.stateTextMap().DRAFT).toBe('Draft');
    expect(component.stateTextMap().PUBLISHED).toBe('Published');
    expect(component.stateSeverityMap().CLOSED).toBe('danger');
    expect(component.stateSeverityMap().APPLICANT_FOUND).toBe('warn');
  });
});
