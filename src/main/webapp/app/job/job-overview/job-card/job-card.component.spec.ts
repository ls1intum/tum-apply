import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClock, faFlaskVial, faGraduationCap, faLocationDot, faUser } from '@fortawesome/free-solid-svg-icons';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

import { JobCardComponent } from './job-card.component';

@Component({ template: '' })
class DummyComponent {}

class MockTranslationLoader implements TranslateLoader {
  getTranslation(): Observable<{}> {
    return of({
      'jobOverviewPage.hoursPerWeek': '{{workload}} h/week',
    });
  }
}

describe('JobCardComponent', () => {
  let component: JobCardComponent;
  let fixture: ComponentFixture<JobCardComponent>;
  let library: FaIconLibrary;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JobCardComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslationLoader },
          defaultLanguage: 'en',
          useDefaultLang: true,
        }),
      ],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'job/detail/:id', component: DummyComponent },
          { path: 'application/create/:id', component: DummyComponent },
        ]),
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);

    library = TestBed.inject(FaIconLibrary);
    library.addIcons(faGraduationCap, faLocationDot, faUser, faClock, faCalendar, faFlaskVial);

    fixture.componentRef.setInput('jobTitle', 'Test Job');
    fixture.componentRef.setInput('jobId', '123');
    fixture.componentRef.setInput('fieldOfStudies', 'Computer Science');
    fixture.componentRef.setInput('location', 'Munich');
    fixture.componentRef.setInput('professor', 'Prof. John Doe');
    fixture.componentRef.setInput('workload', '20');
    fixture.componentRef.setInput('startDate', '2025-10-01');
    fixture.componentRef.setInput('relativeTime', 'Today');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the job title', () => {
    const title = fixture.debugElement.nativeElement.querySelector('.card-title');
    expect(title.textContent).toContain('Test Job');
  });

  it('should display all job info fields correctly', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Computer Science');
    expect(compiled.textContent).toContain('Munich');
    expect(compiled.textContent).toContain('Prof. John Doe');
    expect(compiled.textContent).toContain('20 h/week');
    expect(compiled.textContent).toContain('Start:  01.10.2025');
    expect(compiled.textContent).toContain('Today');
  });

  it('should trigger onViewDetails when "View Details" button is clicked', () => {
    const spy = jest.spyOn(component, 'onViewDetails');
    const button = fixture.debugElement.query(By.css('.view-button')).nativeElement;
    button.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should trigger onApply when "Apply" button is clicked', () => {
    const spy = jest.spyOn(component, 'onApply');
    const button = fixture.debugElement.query(By.css('.apply-button')).nativeElement;
    button.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should navigate to job detail page when "View" button is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');
    const button = fixture.debugElement.query(By.css('.view-button')).nativeElement;
    button.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/job/detail/123']);
  });
});
