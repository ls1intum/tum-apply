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
    it('should return all required application PDF labels', () => {
      const labels = getApplicationPDFLabels(translate);

      // Application header labels
      expect(labels).toHaveProperty('applicationBy');
      expect(labels).toHaveProperty('headline');
      expect(labels).toHaveProperty('overview');

      // Overview Item labels
      expect(labels).toHaveProperty('supervisor');
      expect(labels).toHaveProperty('location');
      expect(labels).toHaveProperty('fieldsOfStudies');
      expect(labels).toHaveProperty('researchArea');
      expect(labels).toHaveProperty('workload');
      expect(labels).toHaveProperty('hoursPerWeek');
      expect(labels).toHaveProperty('duration');
      expect(labels).toHaveProperty('years');
      expect(labels).toHaveProperty('fundingType');
      expect(labels).toHaveProperty('startDate');
      expect(labels).toHaveProperty('endDate');

      // Personal Statements labels
      expect(labels).toHaveProperty('personalStatements');
      expect(labels).toHaveProperty('motivation');
      expect(labels).toHaveProperty('skills');
      expect(labels).toHaveProperty('researchExperience');

      // Personal Information labels
      expect(labels).toHaveProperty('personalInformation');
      expect(labels).toHaveProperty('applicantInfo');
      expect(labels).toHaveProperty('desiredStartDate');
      expect(labels).toHaveProperty('gender');
      expect(labels).toHaveProperty('nationality');
      expect(labels).toHaveProperty('website');
      expect(labels).toHaveProperty('linkedIn');
      expect(labels).toHaveProperty('bachelorInfo');
      expect(labels).toHaveProperty('masterInfo');
      expect(labels).toHaveProperty('degreeName');
      expect(labels).toHaveProperty('university');
      expect(labels).toHaveProperty('upperGradeLimit');
      expect(labels).toHaveProperty('lowerGradeLimit');
      expect(labels).toHaveProperty('grade');

      // Footer labels
      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('byUser');
      expect(labels).toHaveProperty('usingTumapply');
      expect(labels).toHaveProperty('metaEndText');
      expect(labels).toHaveProperty('page');
      expect(labels).toHaveProperty('of');

      // Application-specific labels
      expect(labels).toHaveProperty('application');
      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('jobDescription');
    });

    it('should return correct translation keys for all labels', () => {
      const labels = getApplicationPDFLabels(translate);

      // Application header labels
      expect(labels.applicationBy).toBe('pdf.headerItems.applicationBy');
      expect(labels.headline).toBe('entity.application_detail.headline');
      expect(labels.overview).toBe('entity.application_detail.position_overview');

      // Overview Item labels
      expect(labels.supervisor).toBe('jobDetailPage.header.supervisor');
      expect(labels.location).toBe('jobDetailPage.header.location');
      expect(labels.fieldsOfStudies).toBe('jobDetailPage.labels.fieldOfStudies:');
      expect(labels.researchArea).toBe('jobDetailPage.labels.researchArea:');
      expect(labels.workload).toBe('jobDetailPage.labels.workload:');
      expect(labels.hoursPerWeek).toBe('jobDetailPage.units.hoursPerWeek');
      expect(labels.duration).toBe('jobDetailPage.labels.contractDuration:');
      expect(labels.years).toBe('jobDetailPage.units.years');
      expect(labels.fundingType).toBe('jobDetailPage.labels.fundingType:');
      expect(labels.startDate).toBe('jobDetailPage.labels.startDate:');
      expect(labels.endDate).toBe('jobDetailPage.labels.applicationEndDate:');

      // Personal Statements labels
      expect(labels.personalStatements).toBe('entity.application_detail.personal_statements');
      expect(labels.motivation).toBe('entity.applicationDetail.motivation');
      expect(labels.skills).toBe('entity.applicationDetail.skills');
      expect(labels.researchExperience).toBe('entity.applicationDetail.researchExperience');

      // Personal Information labels
      expect(labels.personalInformation).toBe('entity.application_detail.personal_information');
      expect(labels.applicantInfo).toBe('entity.detail_card.applicant_info');
      expect(labels.desiredStartDate).toBe('entity.detail_card.desired_start_date');
      expect(labels.gender).toBe('entity.detail_card.gender');
      expect(labels.nationality).toBe('entity.detail_card.nationality');
      expect(labels.website).toBe('entity.detail_card.website');
      expect(labels.linkedIn).toBe('entity.detail_card.linkedin');
      expect(labels.bachelorInfo).toBe('entity.detail_card.bachelor_info');
      expect(labels.masterInfo).toBe('entity.detail_card.master_info');
      expect(labels.degreeName).toBe('entity.detail_card.name');
      expect(labels.university).toBe('entity.detail_card.university');
      expect(labels.upperGradeLimit).toBe('entity.detail_card.upper_passing_limit');
      expect(labels.lowerGradeLimit).toBe('entity.detail_card.lower_passing_limit');
      expect(labels.grade).toBe('entity.detail_card.grade');

      // Footer labels
      expect(labels.thisDocumentWasGeneratedOn).toBe('pdf.metaData.thisDocumentWasGeneratedOn');
      expect(labels.byUser).toBe('pdf.metaData.byUser');
      expect(labels.usingTumapply).toBe('pdf.metaData.usingTumapply');
      expect(labels.metaEndText).toBe('pdf.metaData.metaEndText');
      expect(labels.page).toBe('pdf.pageCount.page');
      expect(labels.of).toBe('pdf.pageCount.of');

      // Application-specific labels
      expect(labels.application).toBe('evaluation.application');
      expect(labels.researchGroup).toBe('jobDetailPage.header.researchGroup');
      expect(labels.jobDescription).toBe('jobDetailPage.sections.jobDescription');
    });

    it('should append colons to specific overview labels', () => {
      const labels = getApplicationPDFLabels(translate);

      expect(labels.fieldsOfStudies).toContain(':');
      expect(labels.researchArea).toContain(':');
      expect(labels.workload).toContain(':');
      expect(labels.duration).toContain(':');
      expect(labels.fundingType).toContain(':');
      expect(labels.startDate).toContain(':');
      expect(labels.endDate).toContain(':');
    });
  });

  describe('getJobPDFLabels', () => {
    it('should return all required job PDF labels', () => {
      const labels = getJobPDFLabels(translate);

      // Job header labels
      expect(labels).toHaveProperty('jobBy');
      expect(labels).toHaveProperty('forJob');
      expect(labels).toHaveProperty('status');

      // Overview Item labels
      expect(labels).toHaveProperty('supervisor');
      expect(labels).toHaveProperty('location');
      expect(labels).toHaveProperty('fieldsOfStudies');
      expect(labels).toHaveProperty('researchArea');
      expect(labels).toHaveProperty('workload');
      expect(labels).toHaveProperty('hoursPerWeek');
      expect(labels).toHaveProperty('duration');
      expect(labels).toHaveProperty('years');
      expect(labels).toHaveProperty('fundingType');
      expect(labels).toHaveProperty('startDate');
      expect(labels).toHaveProperty('endDate');

      // Job Detail labels
      expect(labels).toHaveProperty('jobDetails');
      expect(labels).toHaveProperty('description');
      expect(labels).toHaveProperty('tasksResponsibilities');
      expect(labels).toHaveProperty('eligibilityCriteria');

      // Research Group Details labels
      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('contactDetails');
      expect(labels).toHaveProperty('address');
      expect(labels).toHaveProperty('email');
      expect(labels).toHaveProperty('website');

      // Footer labels
      expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
      expect(labels).toHaveProperty('byUser');
      expect(labels).toHaveProperty('usingTumapply');
      expect(labels).toHaveProperty('metaEndText');
      expect(labels).toHaveProperty('page');
      expect(labels).toHaveProperty('of');

      // Job-specific labels
      expect(labels).toHaveProperty('jobPdfEnding');
      expect(labels).toHaveProperty('overview');
    });

    it('should return correct translation keys for all labels', () => {
      const labels = getJobPDFLabels(translate);

      // Job header labels
      expect(labels.jobBy).toBe('pdf.headerItems.jobBy');
      expect(labels.forJob).toBe('pdf.headerItems.forJob');
      expect(labels.status).toBe('pdf.headerItems.status');

      // Overview Item labels
      expect(labels.supervisor).toBe('jobDetailPage.header.supervisor');
      expect(labels.location).toBe('jobDetailPage.header.location');
      expect(labels.fieldsOfStudies).toBe('jobDetailPage.labels.fieldOfStudies:');
      expect(labels.researchArea).toBe('jobDetailPage.labels.researchArea:');
      expect(labels.workload).toBe('jobDetailPage.labels.workload:');
      expect(labels.hoursPerWeek).toBe('jobDetailPage.units.hoursPerWeek');
      expect(labels.duration).toBe('jobDetailPage.labels.contractDuration:');
      expect(labels.years).toBe('jobDetailPage.units.years');
      expect(labels.fundingType).toBe('jobDetailPage.labels.fundingType:');
      expect(labels.startDate).toBe('jobDetailPage.labels.startDate:');
      expect(labels.endDate).toBe('jobDetailPage.labels.applicationEndDate:');

      // Job Detail labels
      expect(labels.jobDetails).toBe('pdf.sections.jobDetails');
      expect(labels.description).toBe('pdf.sections.description');
      expect(labels.tasksResponsibilities).toBe('jobDetailPage.sections.tasksResponsibilities');
      expect(labels.eligibilityCriteria).toBe('jobDetailPage.sections.eligibilityCriteria');

      // Research Group Details labels
      expect(labels.researchGroup).toBe('jobDetailPage.cards.researchGroup');
      expect(labels.contactDetails).toBe('pdf.sections.contactDetails');
      expect(labels.address).toBe('researchGroup.groupInfo.fields.section3');
      expect(labels.email).toBe('researchGroup.groupInfo.fields.email');
      expect(labels.website).toBe('researchGroup.groupInfo.fields.website');

      // Footer labels
      expect(labels.thisDocumentWasGeneratedOn).toBe('pdf.metaData.thisDocumentWasGeneratedOn');
      expect(labels.byUser).toBe('pdf.metaData.byUser');
      expect(labels.usingTumapply).toBe('pdf.metaData.usingTumapply');
      expect(labels.metaEndText).toBe('pdf.metaData.metaEndText');
      expect(labels.page).toBe('pdf.pageCount.page');
      expect(labels.of).toBe('pdf.pageCount.of');

      // Job-specific labels
      expect(labels.jobPdfEnding).toBe('pdf.jobPdfEnding');
      expect(labels.overview).toBe('jobDetailPage.cards.positionOverview');
    });

    it('should append colons to specific overview labels', () => {
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

  describe('Application-specific labels', () => {
    it('should include application header labels not in job labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(appLabels.applicationBy).toBe('pdf.headerItems.applicationBy');
      expect(jobLabels.applicationBy).toBeUndefined();
    });

    it('should include personal information labels not in job labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(appLabels.personalInformation).toBe('entity.application_detail.personal_information');
      expect(appLabels.applicantInfo).toBe('entity.detail_card.applicant_info');
      expect(jobLabels.personalInformation).toBeUndefined();
      expect(jobLabels.applicantInfo).toBeUndefined();
    });

    it('should include personal statements labels not in job labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(appLabels.personalStatements).toBe('entity.application_detail.personal_statements');
      expect(appLabels.motivation).toBe('entity.applicationDetail.motivation');
      expect(jobLabels.personalStatements).toBeUndefined();
      expect(jobLabels.motivation).toBeUndefined();
    });

    it('should include research group label in applications', () => {
      const appLabels = getApplicationPDFLabels(translate);

      expect(appLabels.researchGroup).toBe('jobDetailPage.header.researchGroup');
    });
  });

  describe('Job-specific labels', () => {
    it('should include job header labels not in application labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(jobLabels.jobBy).toBe('pdf.headerItems.jobBy');
      expect(jobLabels.forJob).toBe('pdf.headerItems.forJob');
      expect(appLabels.jobBy).toBeUndefined();
      expect(appLabels.forJob).toBeUndefined();
    });

    it('should include job detail labels not in application labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(jobLabels.jobDetails).toBe('pdf.sections.jobDetails');
      expect(jobLabels.tasksResponsibilities).toBe('jobDetailPage.sections.tasksResponsibilities');
      expect(appLabels.jobDetails).toBeUndefined();
      expect(appLabels.tasksResponsibilities).toBeUndefined();
    });

    it('should include research group details labels', () => {
      const jobLabels = getJobPDFLabels(translate);

      expect(jobLabels.researchGroup).toBe('jobDetailPage.cards.researchGroup');
      expect(jobLabels.contactDetails).toBe('pdf.sections.contactDetails');
      expect(jobLabels.address).toBe('researchGroup.groupInfo.fields.section3');
      expect(jobLabels.email).toBe('researchGroup.groupInfo.fields.email');
      expect(jobLabels.website).toBe('researchGroup.groupInfo.fields.website');
    });

    it('should include job-specific ending label', () => {
      const jobLabels = getJobPDFLabels(translate);

      expect(jobLabels.jobPdfEnding).toBe('pdf.jobPdfEnding');
    });
  });

  describe('Shared labels', () => {
    it('should include shared overview labels in both application and job', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      // Check that overview labels exist in both
      expect(appLabels.supervisor).toBe(jobLabels.supervisor);
      expect(appLabels.location).toBe(jobLabels.location);
      expect(appLabels.fieldsOfStudies).toBe(jobLabels.fieldsOfStudies);
      expect(appLabels.researchArea).toBe(jobLabels.researchArea);
      expect(appLabels.workload).toBe(jobLabels.workload);
      expect(appLabels.hoursPerWeek).toBe(jobLabels.hoursPerWeek);
      expect(appLabels.duration).toBe(jobLabels.duration);
      expect(appLabels.years).toBe(jobLabels.years);
      expect(appLabels.fundingType).toBe(jobLabels.fundingType);
      expect(appLabels.startDate).toBe(jobLabels.startDate);
      expect(appLabels.endDate).toBe(jobLabels.endDate);
    });

    it('should include shared footer labels in both application and job', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expect(appLabels.thisDocumentWasGeneratedOn).toBe(jobLabels.thisDocumentWasGeneratedOn);
      expect(appLabels.byUser).toBe(jobLabels.byUser);
      expect(appLabels.usingTumapply).toBe(jobLabels.usingTumapply);
      expect(appLabels.metaEndText).toBe(jobLabels.metaEndText);
      expect(appLabels.page).toBe(jobLabels.page);
      expect(appLabels.of).toBe(jobLabels.of);
    });
  });
});
