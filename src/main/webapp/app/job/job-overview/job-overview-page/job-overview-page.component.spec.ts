import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { JobResourceService, PageJobCardDTO } from 'app/generated';

import { JobCardListComponent } from '../job-card-list/job-card-list.component';

import { JobOverviewPageComponent } from './job-overview-page.component';

describe('JobOverviewPageComponent', () => {
  let component: JobOverviewPageComponent;
  let fixture: ComponentFixture<JobOverviewPageComponent>;
  let jobServiceMock: Partial<Record<keyof JobResourceService, jest.Mock>>;

  beforeEach(async () => {
    jobServiceMock = {
      getAvailableJobs: jest.fn().mockReturnValue(of({ content: [], totalElements: 0 } as PageJobCardDTO)),
    };

    await TestBed.configureTestingModule({
      imports: [JobOverviewPageComponent, JobCardListComponent],
      providers: [{ provide: JobResourceService, useValue: jobServiceMock }, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(JobOverviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
