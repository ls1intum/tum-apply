import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faGlobe, faLocationDot, faMicroscope, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { JobDetailDTO, JobResourceService } from '../../generated';
import { AccountService } from '../../core/auth/account.service';

import { JobDetailComponent } from './job-detail.component';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let router: Router;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get(key: string) {
          if (key === 'job_id') return '123';
          return null;
        },
      },
    },
  };

  const mockJobService = {
    getJobDetails: jest.fn().mockReturnValue(
      of({
        title: 'Test Title',
        supervisingProfessorName: 'Prof. John Doe',
        researchGroup: {
          name: 'AI Lab',
          description: 'AI Group Desc',
          email: 'ai@tum.de',
          website: 'https://ai.tum.de',
          street: 'Main Street 1',
          postalCode: '12345',
          city: 'Munich',
        },
        fieldOfStudies: 'Computer Science',
        researchArea: 'Deep Learning',
        location: 'Munich',
        workload: 20,
        contractDuration: 2,
        fundingType: 'Fully Funded',
        startDate: '2025-10-01',
        createdAt: '2024-09-01',
        lastModifiedAt: '2024-12-01',
        description: '<p>Job Description</p>',
        tasks: '<ol><li>Task A</li><li>Task B</li></ol>',
        requirements: '<ul><li>Requirement A</li></ul>',
      } as JobDetailDTO),
    ),
  };

  const mockAccountService = {
    loadedUser: jest.fn().mockReturnValue({ id: '222' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: JobResourceService, useValue: mockJobService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faUserTie, faMicroscope, faLocationDot, faEnvelope, faGlobe);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all key values correctly in the template', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Test Title');
    expect(compiled.textContent).toContain('Prof. John Doe');
    expect(compiled.textContent).toContain('AI Lab');
    expect(compiled.textContent).toContain('Computer Science');
    expect(compiled.textContent).toContain('Deep Learning');
    expect(compiled.textContent).toContain('Munich');
    expect(compiled.textContent).toContain('20');
    expect(compiled.textContent).toContain('2');
    expect(compiled.textContent).toContain('Fully Funded');
    expect(compiled.textContent).toContain('01.10.2025');
    expect(compiled.textContent).toContain('01.09.2024');
    expect(compiled.textContent).toContain('01.12.2024');
    expect(compiled.innerHTML).toContain('<ol><li>Task A</li><li>Task B</li></ol>');
    expect(compiled.innerHTML).toContain('<ul><li>Requirement A</li></ul>');
    expect(compiled.textContent).toContain('AI Group Desc');
    expect(compiled.textContent).toContain('ai@tum.de');
    expect(compiled.textContent).toContain('https://ai.tum.de');
    expect(compiled.textContent).toContain('Main Street 1');
    expect(compiled.textContent).toContain('12345');
    expect(compiled.textContent).toContain('Munich');
  });

  it('should render mailto link for research group email', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const emailLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href^="mailto:"]');
    expect(emailLink.href).toContain('mailto:ai@tum.de');
    expect(emailLink.textContent).toContain('ai@tum.de');
  });

  it('should render research group website link', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const websiteLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="https://ai.tum.de"]');
    expect(websiteLink).toBeTruthy();
    expect(websiteLink.textContent).toContain('https://ai.tum.de');
  });

  it('should navigate to the application page on apply', () => {
    const spy = jest.spyOn(router, 'navigate');
    component.onApply();
    expect(spy).toHaveBeenCalledWith(['/application/create/123']);
  });
});
