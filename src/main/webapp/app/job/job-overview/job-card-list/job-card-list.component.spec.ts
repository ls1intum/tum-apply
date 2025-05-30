import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { JobResourceService, PageJobCardDTO } from 'app/generated';

import { JobCardListComponent } from './job-card-list.component';

describe('JobCardListComponent', () => {
  let component: JobCardListComponent;
  let fixture: ComponentFixture<JobCardListComponent>;

  const mockJobService = {
    getAvailableJobs: jest.fn().mockReturnValue(
      of({
        content: [],
        totalElements: 0,
      } as PageJobCardDTO),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardListComponent],
      providers: [{ provide: JobResourceService, useValue: mockJobService }, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
