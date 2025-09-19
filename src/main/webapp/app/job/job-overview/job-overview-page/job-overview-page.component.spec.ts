import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowDown19, faArrowDownAZ, faArrowUp19, faArrowUpAZ, faChevronDown, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import { JobCardListComponent } from '../job-card-list/job-card-list.component';
import { JobResourceApiService } from '../../../generated/api/jobResourceApi.service';
import { PageJobCardDTO } from '../../../generated/model/pageJobCardDTO';

import { JobOverviewPageComponent } from './job-overview-page.component';

describe('JobOverviewPageComponent', () => {
  let component: JobOverviewPageComponent;
  let fixture: ComponentFixture<JobOverviewPageComponent>;
  let jobServiceMock: Partial<Record<keyof JobResourceApiService, jest.Mock>>;

  beforeEach(async () => {
    jobServiceMock = {
      getAvailableJobs: jest.fn().mockReturnValue(of({ content: [], totalElements: 0 } as PageJobCardDTO)),
    };

    await TestBed.configureTestingModule({
      imports: [JobOverviewPageComponent, JobCardListComponent, TranslateModule.forRoot()],
      providers: [{ provide: JobResourceApiService, useValue: jobServiceMock }, provideHttpClientTesting()],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faGraduationCap, faArrowUpAZ, faArrowDownAZ, faArrowUp19, faArrowDown19, faChevronDown);

    fixture = TestBed.createComponent(JobOverviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading.getAttribute('jhiTranslate')).toBe('jobOverviewPage.title');
  });

  it('should render the JobCardListComponent', () => {
    const jobCardList = fixture.nativeElement.querySelector('jhi-job-card-list');
    expect(jobCardList).toBeTruthy();
  });

  it('should match the DOM structure', () => {
    expect(fixture.nativeElement.innerHTML).toContain('jobOverviewPage.title');
    expect(fixture.nativeElement.querySelector('jhi-job-card-list')).not.toBeNull();
  });
});
