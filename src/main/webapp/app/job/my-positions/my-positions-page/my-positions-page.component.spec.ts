import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from 'app/core/auth/account.service';
import { TranslateModule } from '@ngx-translate/core';
import { faArrowDown19, faArrowDownAZ, faArrowUp19, faArrowUpAZ, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

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

class MockAccountService {
  loadedUser = (): { id: string } => ({ id: 'professor-id' });
}

describe('MyPositionsPageComponent', () => {
  let component: MyPositionsPageComponent;
  let fixture: ComponentFixture<MyPositionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClientTesting(),
        { provide: JobResourceService, useClass: MockJobResourceService },
        { provide: AccountService, useClass: MockAccountService },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faArrowUpAZ, faArrowDownAZ, faArrowUp19, faArrowDown19, faChevronDown);

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
    expect(component.stateTextMap().DRAFT).toBe('jobState.draft');
    expect(component.stateTextMap().PUBLISHED).toBe('jobState.published');
    expect(component.stateTextMap().CLOSED).toBe('jobState.closed');
    expect(component.stateTextMap().APPLICANT_FOUND).toBe('jobState.applicantFound');
    expect(component.stateSeverityMap().DRAFT).toBe('info');
    expect(component.stateSeverityMap().PUBLISHED).toBe('success');
    expect(component.stateSeverityMap().CLOSED).toBe('danger');
    expect(component.stateSeverityMap().APPLICANT_FOUND).toBe('warn');
  });

  it('should define expected column headers', () => {
    const columns = component.columns();
    const headers = columns.map(col => col.header);
    const expectedHeaders = [
      '', // avatar column
      'myPositionsPage.tableColumn.supervisingProfessor',
      'myPositionsPage.tableColumn.job',
      'myPositionsPage.tableColumn.status',
      'myPositionsPage.tableColumn.startDate',
      'myPositionsPage.tableColumn.created',
      'myPositionsPage.tableColumn.lastModified',
      '', // actions column
    ];
    expect(headers).toEqual(expectedHeaders);
  });

  it('should render action buttons for each job', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const viewButtons = element.querySelectorAll('[data-testid="view"]');
    const editButtons = element.querySelectorAll('[data-testid="edit"]');
    const deleteButtons = element.querySelectorAll('[data-testid="delete"]');

    expect(viewButtons.length).toBe(mockJobs.length);
    expect(editButtons.length).toBe(mockJobs.length);
    expect(deleteButtons.length).toBe(mockJobs.length);
  });
});
