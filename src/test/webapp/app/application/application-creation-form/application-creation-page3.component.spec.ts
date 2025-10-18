import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage3Component, {
  getPage3FromApplication,
} from '../../../../../main/webapp/app/application/application-creation/application-creation-page3/application-creation-page3.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';

describe('ApplicationPage3Component', () => {
  let fixture: ComponentFixture<ApplicationCreationPage3Component>;
  let comp: ApplicationCreationPage3Component;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage3Component],
      providers: [provideRouter([]), provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationPage3Component);
    comp = fixture.componentInstance;
    comp.hasInitialized.set(false);
    comp.data.set({
      desiredStartDate: '',
      motivation: '',
      skills: '',
      experiences: '',
    });
    fixture.detectChanges();
  });
  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should set cvValid to false when cvDocs is undefined or empty', () => {
    comp.cvDocsSetValidity(undefined);
    expect(comp.cvValid()).toBe(false);

    comp.cvDocsSetValidity([]);
    expect(comp.cvValid()).toBe(false);
  });

  it('should set cvValid to true when cvDocs is provided', () => {
    comp.cvDocsSetValidity([{ id: '1', size: 1 }]);
    expect(comp.cvValid()).toBe(true);
  });

  it('should update desiredStartDate in form and data when setDesiredStartDate is called', () => {
    const newDate = '2025-12-25';
    comp.setDesiredStartDate(newDate);

    expect(comp.data()?.desiredStartDate).toBe(newDate);
    expect(comp.page3Form.value.desiredStartDate).toBe(newDate);
  });

  it('should mark form as invalid when required fields are empty', () => {
    comp.page3Form.patchValue({
      experiences: '',
      motivation: '',
      skills: '',
    });
    expect(comp.page3Form.valid).toBe(false);
  });

  it('should mark form as valid when required fields are filled and CV is set', () => {
    comp.cvDocsSetValidity([{ id: '1', size: 1 }]);
    comp.page3Form.patchValue({
      experiences: '<p>Experience</p>',
      motivation: '<p>Motivation</p>',
      skills: '<p>Skills</p>',
    });

    expect(comp.page3Form.valid).toBe(true);
    expect(comp.cvValid()).toBe(true);
  });

  it('should patch form with initial data on first run', () => {
    comp.data.set({
      experiences: '<p>Initial Exp</p>',
      motivation: '<p>Initial Mot</p>',
      skills: '<p>Initial Skills</p>',
      desiredStartDate: '2025-01-01',
    });
    comp.hasInitialized.set(false);

    fixture.detectChanges();

    expect(comp.page3Form.value.experiences).toBe('<p>Initial Exp</p>');
    expect(comp.page3Form.value.motivation).toBe('<p>Initial Mot</p>');
    expect(comp.page3Form.value.skills).toBe('<p>Initial Skills</p>');
    expect(comp.page3Form.value.desiredStartDate).toBe('2025-01-01');
  });

  it('should render editors when hasInitialized is true', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.motivation"]')).toBeTruthy();
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.skills"]')).toBeTruthy();
    expect(compiled.querySelector('jhi-editor[label="entity.applicationPage3.label.experiences"]')).toBeTruthy();
  });

  it('should emit changed when emitChanged is called', () => {
    const changedSpy = vi.fn();
    comp.changed.subscribe(changedSpy);

    comp.emitChanged();
    expect(changedSpy).toHaveBeenCalledWith(true);
  });

  it('should return array with doc if documentIdsCv is defined', () => {
    const doc = { id: '1', size: 1 };

    fixture.componentRef.setInput('documentIdsCv', doc);
    fixture.detectChanges();

    expect(comp.computedDocumentIdsCvSet()).toEqual([doc]);
  });

  it('should return undefined if documentIdsCv is undefined', () => {
    fixture.componentRef.setInput('documentIdsCv', undefined);
    fixture.detectChanges();

    expect(comp.computedDocumentIdsCvSet()).toBeUndefined();
  });

  it('should normalize undefined values in form to empty strings in updateEffect', () => {
    comp.page3Form.patchValue({
      experiences: undefined,
      motivation: undefined,
      skills: undefined,
      desiredStartDate: undefined,
    });

    expect(comp.data()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  it('should normalize undefined values to empty strings in updateEffect mapping', () => {
    // Reset and simulate data + initialized form
    comp.data.set({
      experiences: 'Old',
      motivation: 'Old',
      skills: 'Old',
      desiredStartDate: 'Old',
    });

    comp.hasInitialized.set(true);

    comp.page3Form.patchValue({
      experiences: undefined,
      motivation: undefined,
      skills: undefined,
      desiredStartDate: undefined,
    });

    // Wait for effect to run (simulate debounce time)
    fixture.detectChanges();

    expect(comp.data()).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });
  });

  // getPage3FromApplication
  it('should extract all fields when all values are present', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-12-25',
      motivation: 'Because I love coding',
      specialSkills: 'Angular, TypeScript',
      projects: 'Built multiple apps',
      applicationState: 'SAVED',
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: '',
      },
    };

    const result = getPage3FromApplication(application);

    expect(result).toEqual({
      desiredStartDate: '2025-12-25',
      motivation: 'Because I love coding',
      skills: 'Angular, TypeScript',
      experiences: 'Built multiple apps',
    });
  });

  it('should return empty string for missing desiredDate', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: undefined,
      motivation: 'Motivation',
      specialSkills: 'Skills',
      projects: 'Projects',
      applicationState: 'SAVED',
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: '',
      },
    };

    const result = getPage3FromApplication(application);

    expect(result.desiredStartDate).toBe('');
    expect(result.motivation).toBe('Motivation');
  });

  it('should return empty string for missing motivation', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-01-01',
      motivation: undefined,
      specialSkills: 'Skills',
      projects: 'Projects',
      applicationState: 'SAVED',
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: '',
      },
    };

    const result = getPage3FromApplication(application);

    expect(result.motivation).toBe('');
  });

  it('should return empty string for missing specialSkills', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-01-01',
      motivation: 'Motivation',
      specialSkills: undefined,
      projects: 'Projects',
      applicationState: 'SAVED',
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: '',
      },
    };

    const result = getPage3FromApplication(application);

    expect(result.skills).toBe('');
  });

  it('should return empty string for missing projects', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-01-01',
      motivation: 'Motivation',
      specialSkills: 'Skills',
      projects: undefined,
      applicationState: 'SAVED',
      job: {
        fieldOfStudies: '',
        jobId: '',
        location: '',
        professorName: '',
        title: '',
      },
    };

    const result = getPage3FromApplication(application);

    expect(result.experiences).toBe('');
  });

  it('should return empty strings for all undefined fields', () => {
    const application = {} as ApplicationForApplicantDTO;

    const result = getPage3FromApplication(application);

    expect(result).toEqual({
      desiredStartDate: '',
      motivation: '',
      skills: '',
      experiences: '',
    });
  });

  it('should set desiredStartDate to empty string when desiredStartDateEvent is undefined', () => {
    comp.setDesiredStartDate(undefined);
    expect(comp.data().desiredStartDate).toBe('');
  });

  it('should not patch form if data is undefined in initializeFormEffect', () => {
    const testFixture = TestBed.createComponent(ApplicationCreationPage3Component);
    const testComp = testFixture.componentInstance;

    testComp.data.set(undefined as any);
    testComp.hasInitialized.set(false);

    testFixture.detectChanges();

    expect(testComp.page3Form.value).toEqual({
      experiences: '',
      motivation: '',
      skills: '',
      desiredStartDate: '',
    });

    expect(testComp.hasInitialized()).toBe(false);
  });
});
