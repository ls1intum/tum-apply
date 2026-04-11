import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationPage3Component, {
  getPage3FromApplication,
} from '../../../../../../main/webapp/app/application/application-creation/application-creation-page3/application-creation-page3.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import {
  ApplicationForApplicantDTO,
  ApplicationForApplicantDTOApplicationStateEnum,
} from 'app/generated/model/application-for-applicant-dto';
import { JobFormDTOLocationEnum, JobFormDTOSubjectAreaEnum } from 'app/generated/model/job-form-dto';
import { provideHttpClientMock } from 'util/http-client.mock';

describe('ApplicationPage3Component', () => {
  let fixture: ComponentFixture<ApplicationCreationPage3Component>;
  let comp: ApplicationCreationPage3Component;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationPage3Component],
      providers: [provideRouter([]), provideTranslateMock(), provideFontAwesomeTesting(), provideHttpClientMock()],
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
  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(comp).toBeTruthy();
    });
  });

  describe('Validation Status', () => {
    it('should have invalid form status when required fields are empty', () => {
      comp.data.set({
        experiences: '',
        motivation: '',
        skills: '',
        desiredStartDate: '',
      });
      comp.hasInitialized.set(false);
      fixture.detectChanges();

      expect(comp.formStatus()).toBe('INVALID');
    });

    it('should have valid form status when required fields are filled', () => {
      comp.data.set({
        experiences: '<p>Experience</p>',
        motivation: '<p>Motivation</p>',
        skills: '<p>Skills</p>',
        desiredStartDate: '',
      });
      comp.hasInitialized.set(false);
      fixture.detectChanges();

      expect(comp.formStatus()).toBe('VALID');
    });
  });

  describe('Initialization Behavior', () => {
    it('should set hasInitialized flag when data is provided', () => {
      comp.data.set({
        experiences: '<p>Initial Exp</p>',
        motivation: '<p>Initial Mot</p>',
        skills: '<p>Initial Skills</p>',
        desiredStartDate: '2025-01-01',
      });
      comp.hasInitialized.set(false);

      fixture.detectChanges();

      expect(comp.hasInitialized()).toBe(true);
    });

    it('should not initialize when data is undefined', () => {
      comp.data.set(undefined as any);
      comp.hasInitialized.set(false);

      fixture.detectChanges();

      expect(comp.hasInitialized()).toBe(false);
    });
  });

  describe('Date Handling', () => {
    it('should update desiredStartDate in data signal when setDesiredStartDate is called', () => {
      const newDate = '2025-12-25';
      comp.setDesiredStartDate(newDate);

      expect(comp.data()?.desiredStartDate).toBe(newDate);
    });

    it('should set desiredStartDate to empty string when desiredStartDateEvent is undefined', () => {
      comp.setDesiredStartDate(undefined);
      expect(comp.data()?.desiredStartDate).toBe('');
    });
  });

  describe('Change Events', () => {
    it('should emit changed when emitChanged is called', () => {
      const changedSpy = vi.fn();
      comp.changed.subscribe(changedSpy);

      comp.emitChanged();
      expect(changedSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('Data Normalization', () => {
    it('should normalize undefined values to empty strings in data signal', async () => {
      // Set initial data and mark as initialized
      comp.data.set({
        experiences: 'Old',
        motivation: 'Old',
        skills: 'Old',
        desiredStartDate: 'Old',
      });

      comp.hasInitialized.set(true);

      // Simulate form clearing by patching with undefined values
      comp.page3Form.patchValue({
        experiences: undefined,
        motivation: undefined,
        skills: undefined,
        desiredStartDate: undefined,
      });

      // Wait for debounce and effect to run
      await new Promise(resolve => setTimeout(resolve, 150));
      fixture.detectChanges();

      // Verify data signal normalized undefined to empty strings
      expect(comp.data()).toEqual({
        experiences: '',
        motivation: '',
        skills: '',
        desiredStartDate: '',
      });
    });
  });

  describe('getPage3FromApplication', () => {
    const application: ApplicationForApplicantDTO = {
      desiredDate: '2025-12-25',
      motivation: 'Because I love coding',
      specialSkills: 'Angular, TypeScript',
      projects: 'Built multiple apps',
      applicationState: ApplicationForApplicantDTOApplicationStateEnum.Saved,
      job: {
        jobId: 'id-123',
        location: JobFormDTOLocationEnum.Garching,
        professorName: 'profName',
        title: 'title',
        subjectArea: JobFormDTOSubjectAreaEnum.ComputerScience,
      },
    };

    it('should extract all fields when all values are present', () => {
      const result = getPage3FromApplication(application);

      expect(result).toEqual({
        desiredStartDate: '2025-12-25',
        motivation: 'Because I love coding',
        skills: 'Angular, TypeScript',
        experiences: 'Built multiple apps',
      });
    });

    it('should return empty string for missing desiredDate', () => {
      const applicationWithDesiredDateUndefined: ApplicationForApplicantDTO = {
        ...application,
        desiredDate: undefined,
      };

      const result = getPage3FromApplication(applicationWithDesiredDateUndefined);

      expect(result.desiredStartDate).toBe('');
      expect(result.motivation).toBe('Because I love coding');
    });

    it('should return empty string for missing motivation', () => {
      const applicationWithMotivationUndefined: ApplicationForApplicantDTO = {
        ...application,
        motivation: undefined,
      };

      const result = getPage3FromApplication(applicationWithMotivationUndefined);

      expect(result.motivation).toBe('');
    });

    it('should return empty string for missing specialSkills', () => {
      const applicationWithSpecialSkillsUndefined: ApplicationForApplicantDTO = {
        ...application,
        specialSkills: undefined,
      };

      const result = getPage3FromApplication(applicationWithSpecialSkillsUndefined);

      expect(result.skills).toBe('');
    });

    it('should return empty string for missing projects', () => {
      const applicationWithProjectsUndefined: ApplicationForApplicantDTO = {
        ...application,
        projects: undefined,
      };

      const result = getPage3FromApplication(applicationWithProjectsUndefined);

      expect(result.experiences).toBe('');
    });

    it('should return empty strings for all undefined fields', () => {
      const applicationEmpty = {} as ApplicationForApplicantDTO;

      const result = getPage3FromApplication(applicationEmpty);

      expect(result).toEqual({
        desiredStartDate: '',
        motivation: '',
        skills: '',
        experiences: '',
      });
    });
  });
});
