import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideTranslateMock } from '../../../util/translate.mock';
import { getApplicationPDFLabels, getJobPDFLabels } from 'app/shared/language/pdf-labels';

describe('PDF Labels', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateMock()],
    });

    translate = TestBed.inject(TranslateService);
  });

  describe('getApplicationPDFLabels', () => {
    it('should return all application PDF labels', () => {
      const labels = getApplicationPDFLabels(translate);

      expect(labels).toHaveProperty('applicationBy');
      expect(labels).toHaveProperty('forPosition');
      expect(labels).toHaveProperty('status');
      expect(labels).toHaveProperty('headline');
      expect(labels).toHaveProperty('overview');
      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('jobDescription');
      expect(labels).toHaveProperty('supervisor');
      expect(labels).toHaveProperty('location');
      expect(labels).toHaveProperty('personalStatements');
      expect(labels).toHaveProperty('motivation');
      expect(labels).toHaveProperty('skills');
      expect(labels).toHaveProperty('researchExperience');
      expect(labels).toHaveProperty('personalInformation');
      expect(labels).toHaveProperty('applicantInfo');
      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('byUser');
      expect(labels).toHaveProperty('usingTumapply');
      expect(labels).toHaveProperty('page');
      expect(labels).toHaveProperty('of');
    });

    it('should return translation keys as values', () => {
      const labels = getApplicationPDFLabels(translate);

      expect(labels.applicationBy).toBe('pdf.headerItems.applicationBy');
      expect(labels.headline).toBe('entity.application_detail.headline');
      expect(labels.overview).toBe('entity.application_detail.position_overview');
    });
  });

  describe('getJobPDFLabels', () => {
    it('should return all job PDF labels', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels).toHaveProperty('jobBy');
      expect(labels).toHaveProperty('forJob');
      expect(labels).toHaveProperty('status');
      expect(labels).toHaveProperty('jobPdfEnding');
      expect(labels).toHaveProperty('overview');
      expect(labels).toHaveProperty('supervisor');
      expect(labels).toHaveProperty('location');
      expect(labels).toHaveProperty('jobDetails');
      expect(labels).toHaveProperty('description');
      expect(labels).toHaveProperty('tasksResponsibilities');
      expect(labels).toHaveProperty('eligibilityCriteria');
      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('contactDetails');
      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('page');
    });

    it('should return translation keys as values', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels.jobBy).toBe('pdf.headerItems.jobBy');
      expect(labels.jobPdfEnding).toBe('pdf.jobPdfEnding');
      expect(labels.overview).toBe('jobDetailPage.cards.positionOverview');
    });
  });

  describe('Overview Item Labels', () => {
    it('should include colons for specific fields', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels.fieldsOfStudies).toContain(':');
      expect(labels.researchArea).toContain(':');
      expect(labels.workload).toContain(':');
      expect(labels.duration).toContain(':');
      expect(labels.fundingType).toContain(':');
      expect(labels.startDate).toContain(':');
      expect(labels.endDate).toContain(':');
    });
  });

  describe('Personal Information Labels', () => {
    it('should include all personal information fields', () => {
      const labels = getApplicationPDFLabels(translate);

      expect(labels).toHaveProperty('preferredLanguage');
      expect(labels).toHaveProperty('desiredStartDate');
      expect(labels).toHaveProperty('gender');
      expect(labels).toHaveProperty('nationality');
      expect(labels).toHaveProperty('website');
      expect(labels).toHaveProperty('linkedIn');
      expect(labels).toHaveProperty('bachelorInfo');
      expect(labels).toHaveProperty('masterInfo');
      expect(labels).toHaveProperty('degreeName');
      expect(labels).toHaveProperty('university');
      expect(labels).toHaveProperty('grade');
    });
  });

  describe('Footer Labels', () => {
    it('should include all footer metadata labels in application', () => {
      const labels = getApplicationPDFLabels(translate);

      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('byUser');
      expect(labels).toHaveProperty('usingTumapply');
      expect(labels).toHaveProperty('metaEndText');
      expect(labels).toHaveProperty('page');
      expect(labels).toHaveProperty('of');
    });

    it('should include all footer metadata labels in job', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('byUser');
      expect(labels).toHaveProperty('usingTumapply');
      expect(labels).toHaveProperty('metaEndText');
      expect(labels).toHaveProperty('page');
      expect(labels).toHaveProperty('of');
    });
  });

  describe('Research Group Labels', () => {
    it('should include research group contact details in job labels', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('contactDetails');
      expect(labels).toHaveProperty('address');
      expect(labels).toHaveProperty('email');
      expect(labels).toHaveProperty('website');
    });
  });
});
