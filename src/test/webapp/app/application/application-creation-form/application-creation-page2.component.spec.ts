import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage2Component, {
  bachelorGradingScale,
  getPage2FromApplication,
  masterGradingScale,
} from '../../../../../main/webapp/app/application/application-creation/application-creation-page2/application-creation-page2.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService, User } from 'app/core/auth/account.service';
import { AbstractControl } from '@angular/forms';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';

describe('ApplicationPage2Component', () => {
  let accountService: Pick<AccountService, 'signedIn'>;
  let fixture: ComponentFixture<ApplicationCreationPage2Component>;
  let comp: ApplicationCreationPage2Component;
  beforeEach(async () => {
    accountService = {
      signedIn: signal<boolean>(true),
    };
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage2Component],
      providers: [
        { provide: AccountService, useValue: accountService },
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationPage2Component);
    comp = fixture.componentInstance;
    comp.data.set({
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    });
    comp.hasInitialized.set(true);
    fixture.detectChanges();
  });
  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should populate the form with initial data', () => {
    const formValues = comp.page2Form.value;
    expect(formValues.bachelorDegreeName).toBe('');
    expect(formValues.bachelorDegreeUniversity).toBe('');
    expect(formValues.masterDegreeName).toBe('');
    expect(formValues.masterDegreeUniversity).toBe('');
    expect(formValues.bachelorGrade).toBe(0);
    expect(formValues.masterGrade).toBe(0);
  });

  it('should have an invalid form when required fields are missing', () => {
    expect(comp.page2Form.valid).toBe(false);
  });

  it('should validate the form with correct data', () => {
    comp.page2Form.setValue({
      bachelorDegreeName: 'BSc Computer Science',
      bachelorDegreeUniversity: 'Test University',
      bachelorGrade: 3.5,
      masterDegreeName: 'MSc Computer Science',
      masterDegreeUniversity: 'Test University',
      masterGrade: 3.8,
    });

    fixture.detectChanges();

    expect(comp.page2Form.valid).toBe(true);
  });

  it('should update bachelor grade via setBachelorGradeAsNumber', async () => {
    comp.setBachelorGradeAsNumber(3.2);
    fixture.detectChanges();

    expect(comp.page2Form.get('bachelorGrade')?.value).toBe(3.2);
  });

  it('should update master grade via setMasterGradeAsNumber', () => {
    comp.setMasterGradeAsNumber(3.9);
    fixture.detectChanges();

    expect(comp.page2Form.get('masterGrade')?.value).toBe(3.9);
  });

  it('should invalidate grades outside the range 1-4', () => {
    comp.page2Form.patchValue({ bachelorGrade: 0 });
    expect(comp.page2Form.get('bachelorGrade')?.valid).toBe(false);

    comp.page2Form.patchValue({ bachelorGrade: 5 });
    expect(comp.page2Form.get('bachelorGrade')?.valid).toBe(false);
  });

  it('should initialize form from data signal if not yet initialized', () => {
    comp.hasInitialized.set(false);
    comp.data.set({
      bachelorDegreeName: 'Init BSc',
      bachelorDegreeUniversity: 'Init Uni',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: 3.1,
      masterDegreeName: 'Init MSc',
      masterDegreeUniversity: 'Init Uni',
      masterGradingScale: masterGradingScale[0],
      masterGrade: 3.7,
    });

    fixture.detectChanges();

    expect(comp.page2Form.value).toEqual({
      bachelorDegreeName: 'Init BSc',
      bachelorDegreeUniversity: 'Init Uni',
      bachelorGrade: 3.1,
      masterDegreeName: 'Init MSc',
      masterDegreeUniversity: 'Init Uni',
      masterGrade: 3.7,
    });

    expect(comp.hasInitialized()).toBe(true);
  });

  it('should map full application DTO to page2 data', () => {
    const application: ApplicationForApplicantDTO = {
      job: {
        jobId: 'job-1',
        title: 'Job Title',
        fieldOfStudies: 'CS',
        location: 'Berlin',
        professorName: 'Dr. Smith',
      },
      applicationState: 'SAVED',
      applicant: {
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        bachelorDegreeName: 'BSc Informatics',
        bachelorUniversity: 'TU Berlin',
        bachelorGrade: '3.4',
        bachelorGradingScale: ApplicantDTO.BachelorGradingScaleEnum.OneToFour,
        masterDegreeName: 'MSc Informatics',
        masterUniversity: 'TU Berlin',
        masterGrade: '3.9',
        masterGradingScale: ApplicantDTO.MasterGradingScaleEnum.OneToFour,
      },
    };

    const result = getPage2FromApplication(application);

    expect(result).toEqual({
      bachelorDegreeName: 'BSc Informatics',
      bachelorDegreeUniversity: 'TU Berlin',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: 3.4,
      masterDegreeName: 'MSc Informatics',
      masterDegreeUniversity: 'TU Berlin',
      masterGradingScale: masterGradingScale[0],
      masterGrade: 3.9,
    });
  });

  it('should handle missing grades', () => {
    const application: ApplicationForApplicantDTO = {
      job: {
        jobId: 'job-1',
        title: 'Job Title',
        fieldOfStudies: 'CS',
        location: 'Berlin',
        professorName: 'Dr. Smith',
      },
      applicationState: 'SAVED',
      applicant: {
        user: {
          userId: 'user-2',
          email: 'empty@example.com',
        },
        bachelorDegreeName: 'BSc',
        bachelorUniversity: 'Uni',
        masterDegreeName: 'MSc',
        masterUniversity: 'Uni',
        // grades missing
      },
    };

    const result = getPage2FromApplication(application);

    expect(result).toEqual({
      bachelorDegreeName: 'BSc',
      bachelorDegreeUniversity: 'Uni',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: 'MSc',
      masterDegreeUniversity: 'Uni',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    });
  });

  it('should fallback to empty strings if fields are missing', () => {
    const application: ApplicationForApplicantDTO = {
      job: {
        jobId: 'job-1',
        title: 'Job Title',
        fieldOfStudies: 'CS',
        location: 'Berlin',
        professorName: 'Dr. Smith',
      },
      applicationState: 'SAVED',
      applicant: { user: {} }, // All optional fields missing
    };

    const result = getPage2FromApplication(application);

    expect(result).toEqual({
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    });
  });

  it('should return empty/default values when applicant is undefined', () => {
    const application: ApplicationForApplicantDTO = {
      job: {
        jobId: 'job-1',
        title: 'Job Title',
        fieldOfStudies: 'CS',
        location: 'Berlin',
        professorName: 'Dr. Smith',
      },
      applicationState: 'SAVED',
      // applicant missing entirely
    };

    const result = getPage2FromApplication(application);

    expect(result).toEqual({
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    });
  });

  it('should not patch form if data is undefined', () => {
    const setSpy = vi.spyOn(comp.hasInitialized, 'set');
    comp.data.set(undefined);
    comp.hasInitialized.set(false);

    fixture.detectChanges();

    // Validate that patching didn't happen (no set to true)
    expect(setSpy).not.toHaveBeenCalledWith(true);

    expect(comp.page2Form.value).toEqual({
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGrade: 0,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGrade: 0,
    });
  });

  it('should not emit changed if form data is the same as current data', () => {
    const initialData = {
      bachelorDegreeName: 'BSc',
      bachelorDegreeUniversity: 'Uni',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: 3.2,
      masterDegreeName: 'MSc',
      masterDegreeUniversity: 'Uni',
      masterGradingScale: masterGradingScale[0],
      masterGrade: 3.8,
    };
    comp.data.set(initialData);

    fixture.detectChanges();
    const changedSpy = vi.spyOn(comp.changed, 'emit');

    comp.hasInitialized.set(true);
    comp.page2Form.patchValue({
      bachelorDegreeName: 'BSc',
      bachelorDegreeUniversity: 'Uni',
      bachelorGrade: 3.2,
      masterDegreeName: 'MSc',
      masterDegreeUniversity: 'Uni',
      masterGrade: 3.8,
    });

    fixture.detectChanges();

    expect(changedSpy).not.toHaveBeenCalled();
  });

  it('should not set bachelor grade if data is undefined', () => {
    comp.data.set(undefined as any); // Explicitly clear the data
    comp.setBachelorGradeAsNumber(3.2);

    expect(comp.page2Form.get('bachelorGrade')?.value).toBe(0); // default value
  });
  it('should not set master grade if data is undefined', () => {
    comp.data.set(undefined as any); // Explicitly clear the data
    comp.setMasterGradeAsNumber(3.9);

    expect(comp.page2Form.get('masterGrade')?.value).toBe(0); // default value
  });
  it('should patch null to bachelorGrade if grade is undefined', () => {
    const initialData = {
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: 3.0,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    };
    comp.data.set(initialData);

    comp.setBachelorGradeAsNumber(undefined);

    expect(comp.page2Form.get('bachelorGrade')?.value).toBeNull();
    expect(comp.data()?.bachelorGrade).toBeUndefined(); // still undefined in signal
  });

  it('should patch null to masterGrade if grade is undefined', () => {
    const initialData = {
      bachelorDegreeName: '',
      bachelorDegreeUniversity: '',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: '',
      masterDegreeUniversity: '',
      masterGradingScale: masterGradingScale[0],
      masterGrade: 3.9,
    };
    comp.data.set(initialData);

    comp.setMasterGradeAsNumber(undefined);

    expect(comp.page2Form.get('masterGrade')?.value).toBeNull();
    expect(comp.data()?.masterGrade).toBeUndefined();
  });

  it('should patch 0 to bachelorGrade and masterGrade if grades are undefined', () => {
    comp.hasInitialized.set(false);
    comp.data.set({
      bachelorDegreeName: 'Test BSc',
      bachelorDegreeUniversity: 'Test University',
      bachelorGradingScale: bachelorGradingScale[0],
      bachelorGrade: undefined,
      masterDegreeName: 'Test MSc',
      masterDegreeUniversity: 'Test University',
      masterGradingScale: masterGradingScale[0],
      masterGrade: undefined,
    });

    fixture.detectChanges();

    const formValues = comp.page2Form.value;

    expect(formValues.bachelorGrade).toBe(null);
    expect(formValues.masterGrade).toBe(null);
  });
});
