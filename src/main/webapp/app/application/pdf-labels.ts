import { TranslateService } from '@ngx-translate/core';

export function getApplicationPDFLabels(translate: TranslateService): Record<string, string> {
  return {
    application: translate.instant('evaluation.application'),
    headline: translate.instant('entity.application_detail.headline'),
    overview: translate.instant('entity.application_detail.position_overview'),
    supervisor: translate.instant('jobDetailPage.header.supervisor'),
    researchGroup: translate.instant('jobDetailPage.header.researchGroup'),
    location: translate.instant('jobDetailPage.header.location'),
    personalStatements: translate.instant('entity.application_detail.personal_statements'),
    motivation: translate.instant('entity.applicationDetail.motivation'),
    skills: translate.instant('entity.applicationDetail.skills'),
    researchExperience: translate.instant('entity.applicationDetail.researchExperience'),
    personalInformation: translate.instant('entity.application_detail.personal_information'),
    applicantInfo: translate.instant('entity.detail_card.applicant_info'),
    desiredStartDate: translate.instant('entity.detail_card.desired_start_date'),
    gender: translate.instant('entity.detail_card.gender'),
    nationality: translate.instant('entity.detail_card.nationality'),
    website: translate.instant('entity.detail_card.website'),
    linkedIn: translate.instant('entity.detail_card.linkedin'),
    bachelorInfo: translate.instant('entity.detail_card.bachelor_info'),
    masterInfo: translate.instant('entity.detail_card.master_info'),
    degreeName: translate.instant('entity.detail_card.name'),
    university: translate.instant('entity.detail_card.university'),
    upperGradeLimit: translate.instant('entity.detail_card.upper_passing_limit'),
    lowerGradeLimit: translate.instant('entity.detail_card.lower_passing_limit'),
    grade: translate.instant('entity.detail_card.grade'),
  };
}
