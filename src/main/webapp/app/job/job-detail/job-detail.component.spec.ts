import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faGlobe, faLocationDot, faMicroscope, faUserTie } from '@fortawesome/free-solid-svg-icons';

import { JobDetailComponent } from './job-detail.component';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetailComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faUserTie, faMicroscope, faLocationDot, faEnvelope, faGlobe);

    fixture.componentRef.setInput('title', 'Test Title');
    fixture.componentRef.setInput('jobId', '123');
    fixture.componentRef.setInput('supervisingProfessor', 'Prof. John Doe');
    fixture.componentRef.setInput('researchGroup', 'AI Lab');
    fixture.componentRef.setInput('fieldOfStudies', 'Computer Science');
    fixture.componentRef.setInput('researchArea', 'Deep Learning');
    fixture.componentRef.setInput('location', 'Munich');
    fixture.componentRef.setInput('workload', 20);
    fixture.componentRef.setInput('contractDuration', 2);
    fixture.componentRef.setInput('fundingType', 'Fully Funded');
    fixture.componentRef.setInput('startDate', '01.10.2025');
    fixture.componentRef.setInput('createdAt', '01.09.2024');
    fixture.componentRef.setInput('lastModifiedAt', '01.12.2024');
    fixture.componentRef.setInput('description', '<p>Job Description</p>');
    fixture.componentRef.setInput('tasks', '<ol><li>Task A</li><li>Task B</li></ol>');
    fixture.componentRef.setInput('requirements', '<ul><li>Requirement A</li></ul>');
    fixture.componentRef.setInput('researchGroupDescription', 'AI Group Desc');
    fixture.componentRef.setInput('researchGroupEmail', 'ai@tum.de');
    fixture.componentRef.setInput('researchGroupWebsite', 'https://ai.tum.de');
    fixture.componentRef.setInput('researchGroupStreet', 'Main Street 1');
    fixture.componentRef.setInput('researchGroupPostalCode', '12345');
    fixture.componentRef.setInput('researchGroupCity', 'Munich');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all key values correctly in the template', () => {
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

  it('should render mailto link for research group email', () => {
    const emailLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href^="mailto:"]');
    expect(emailLink.href).toContain('mailto:ai@tum.de');
    expect(emailLink.textContent).toContain('ai@tum.de');
  });

  it('should render research group website link', () => {
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
