/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

export interface JobCardDTO {
  id: string;
  title: string;
  fieldOfStudies: string;
  location: string;
  professorId: string;
  workload: number;
  startDate: string;
  description: string;
  state: JobCardDTO.StateEnum;
  createdAt: string;
}
export namespace JobCardDTO {
  export type StateEnum = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'APPLICANT_FOUND';
  export const StateEnum = {
    Draft: 'DRAFT' as StateEnum,
    Published: 'PUBLISHED' as StateEnum,
    Closed: 'CLOSED' as StateEnum,
    ApplicantFound: 'APPLICANT_FOUND' as StateEnum,
  };
}
