import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideTranslateMock } from '../../../util/translate.mock';
import { getApplicationPDFLabels, getJobPDFLabels } from 'app/shared/language/pdf-labels';

/* ======================================================
 * Helper functions
 * ====================================================== */

function expectOverviewLabels(labels: Record<string, string>) {
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
}

function expectFooterLabels(labels: Record<string, string>) {
  expect(labels).toHaveProperty('thisDocumentWasGeneratedOn');
  expect(labels).toHaveProperty('byUser');
  expect(labels).toHaveProperty('usingTumapply');
  expect(labels).toHaveProperty('metaEndText');
  expect(labels).toHaveProperty('page');
  expect(labels).toHaveProperty('of');
}

function expectColonLabels(labels: Record<string, string>) {
  ['fieldsOfStudies', 'researchArea', 'workload', 'duration', 'fundingType', 'startDate', 'endDate'].forEach(key => {
    expect(labels[key]).toContain(':');
  });
}

function expectLabelTranslations(labels: Record<string, string>, expected: Record<string, string>) {
  Object.entries(expected).forEach(([key, value]) => {
    expect(labels[key]).toBe(value);
  });
}

function expectSharedLabels(a: Record<string, string>, b: Record<string, string>, keys: string[]) {
  keys.forEach(key => {
    expect(a[key]).toBe(b[key]);
  });
}

/* ======================================================
 * Tests
 * ====================================================== */

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

      expect(labels).toHaveProperty('applicationBy');
      expect(labels).toHaveProperty('headline');
      expect(labels).toHaveProperty('overview');

      expectOverviewLabels(labels);
      expectFooterLabels(labels);

      expect(labels).toHaveProperty('personalStatements');
      expect(labels).toHaveProperty('personalInformation');
      expect(labels).toHaveProperty('applicantInfo');
      expect(labels).toHaveProperty('bachelorInfo');
      expect(labels).toHaveProperty('masterInfo');
      expect(labels).toHaveProperty('degreeName');
      expect(labels).toHaveProperty('university');
      expect(labels).toHaveProperty('grade');

      expect(labels).toHaveProperty('application');
      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('jobDescription');
    });

    it('should return correct translation keys', () => {
      const labels = getApplicationPDFLabels(translate);

      expectLabelTranslations(labels, {
        applicationBy: 'pdf.headerItems.applicationBy',
        headline: 'entity.application_detail.headline',
        overview: 'entity.application_detail.position_overview',

        supervisor: 'jobDetailPage.header.supervisor',
        location: 'jobDetailPage.header.location',
        fieldsOfStudies: 'jobDetailPage.labels.fieldOfStudies:',
        researchArea: 'jobDetailPage.labels.researchArea:',
        workload: 'jobDetailPage.labels.workload:',
        hoursPerWeek: 'jobDetailPage.units.hoursPerWeek',
        duration: 'jobDetailPage.labels.contractDuration:',
        years: 'jobDetailPage.units.years',
        fundingType: 'jobDetailPage.labels.fundingType:',
        startDate: 'jobDetailPage.labels.startDate:',
        endDate: 'jobDetailPage.labels.applicationEndDate:',

        personalStatements: 'entity.application_detail.personal_statements',
        motivation: 'entity.applicationDetail.motivation',
        skills: 'entity.applicationDetail.skills',
        researchExperience: 'entity.applicationDetail.researchExperience',

        personalInformation: 'entity.application_detail.personal_information',
        applicantInfo: 'entity.detail_card.applicant_info',
        desiredStartDate: 'entity.detail_card.desired_start_date',
        gender: 'entity.detail_card.gender',
        nationality: 'entity.detail_card.nationality',
        website: 'entity.detail_card.website',
        linkedIn: 'entity.detail_card.linkedin',

        bachelorInfo: 'entity.detail_card.bachelor_info',
        masterInfo: 'entity.detail_card.master_info',
        degreeName: 'entity.detail_card.name',
        university: 'entity.detail_card.university',
        grade: 'entity.detail_card.grade',

        thisDocumentWasGeneratedOn: 'pdf.metaData.thisDocumentWasGeneratedOn',
        byUser: 'pdf.metaData.byUser',
        usingTumapply: 'pdf.metaData.usingTumapply',
        metaEndText: 'pdf.metaData.metaEndText',
        page: 'pdf.pageCount.page',
        of: 'pdf.pageCount.of',

        application: 'evaluation.application',
        researchGroup: 'jobDetailPage.header.researchGroup',
        jobDescription: 'jobDetailPage.sections.jobDescription',
      });
    });

    it('should append colons to overview labels', () => {
      const labels = getApplicationPDFLabels(translate);
      expectColonLabels(labels);
    });
  });

  describe('getJobPDFLabels', () => {
    it('should return all required job PDF labels', () => {
      const labels = getJobPDFLabels(translate);

      expect(labels).toHaveProperty('jobBy');
      expect(labels).toHaveProperty('forJob');
      expect(labels).toHaveProperty('status');

      expectOverviewLabels(labels);
      expectFooterLabels(labels);

      expect(labels).toHaveProperty('jobDetails');
      expect(labels).toHaveProperty('description');
      expect(labels).toHaveProperty('tasksResponsibilities');
      expect(labels).toHaveProperty('eligibilityCriteria');

      expect(labels).toHaveProperty('researchGroup');
      expect(labels).toHaveProperty('contactDetails');
      expect(labels).toHaveProperty('address');
      expect(labels).toHaveProperty('email');
      expect(labels).toHaveProperty('website');

      expect(labels).toHaveProperty('jobPdfEnding');
      expect(labels).toHaveProperty('overview');
    });

    it('should return correct translation keys', () => {
      const labels = getJobPDFLabels(translate);

      expectLabelTranslations(labels, {
        jobBy: 'pdf.headerItems.jobBy',
        forJob: 'pdf.headerItems.forJob',
        status: 'pdf.headerItems.status',

        supervisor: 'jobDetailPage.header.supervisor',
        location: 'jobDetailPage.header.location',
        fieldsOfStudies: 'jobDetailPage.labels.fieldOfStudies:',
        researchArea: 'jobDetailPage.labels.researchArea:',
        workload: 'jobDetailPage.labels.workload:',
        hoursPerWeek: 'jobDetailPage.units.hoursPerWeek',
        duration: 'jobDetailPage.labels.contractDuration:',
        years: 'jobDetailPage.units.years',
        fundingType: 'jobDetailPage.labels.fundingType:',
        startDate: 'jobDetailPage.labels.startDate:',
        endDate: 'jobDetailPage.labels.applicationEndDate:',

        jobDetails: 'pdf.sections.jobDetails',
        description: 'pdf.sections.description',
        tasksResponsibilities: 'jobDetailPage.sections.tasksResponsibilities',
        eligibilityCriteria: 'jobDetailPage.sections.eligibilityCriteria',

        researchGroup: 'jobDetailPage.cards.researchGroup',
        contactDetails: 'pdf.sections.contactDetails',
        address: 'researchGroup.groupInfo.fields.section3',
        email: 'researchGroup.groupInfo.fields.email',
        website: 'researchGroup.groupInfo.fields.website',

        thisDocumentWasGeneratedOn: 'pdf.metaData.thisDocumentWasGeneratedOn',
        byUser: 'pdf.metaData.byUser',
        usingTumapply: 'pdf.metaData.usingTumapply',
        metaEndText: 'pdf.metaData.metaEndText',
        page: 'pdf.pageCount.page',
        of: 'pdf.pageCount.of',

        jobPdfEnding: 'pdf.jobPdfEnding',
        overview: 'jobDetailPage.cards.positionOverview',
      });
    });

    it('should append colons to overview labels', () => {
      const labels = getJobPDFLabels(translate);
      expectColonLabels(labels);
    });
  });

  describe('Shared labels', () => {
    it('should share overview and footer labels', () => {
      const appLabels = getApplicationPDFLabels(translate);
      const jobLabels = getJobPDFLabels(translate);

      expectSharedLabels(appLabels, jobLabels, [
        'supervisor',
        'location',
        'fieldsOfStudies',
        'researchArea',
        'workload',
        'hoursPerWeek',
        'duration',
        'years',
        'fundingType',
        'startDate',
        'endDate',
        'thisDocumentWasGeneratedOn',
        'byUser',
        'usingTumapply',
        'metaEndText',
        'page',
        'of',
      ]);
    });
  });
});
