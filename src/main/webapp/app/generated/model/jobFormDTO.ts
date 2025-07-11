/**
 * OpenAPI definition
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface JobFormDTO { 
    title: string;
    researchArea?: string;
    fieldOfStudies?: string;
    supervisingProfessor: string;
    location: JobFormDTO.LocationEnum;
    startDate?: string;
    workload?: number;
    contractDuration?: number;
    fundingType: JobFormDTO.FundingTypeEnum;
    description?: string;
    tasks?: string;
    requirements?: string;
    state: JobFormDTO.StateEnum;
}
export namespace JobFormDTO {
    export const LocationEnum = {
        Garching: 'GARCHING',
        GarchingHochbrueck: 'GARCHING_HOCHBRUECK',
        Heilbronn: 'HEILBRONN',
        Munich: 'MUNICH',
        Straubing: 'STRAUBING',
        Weihenstephan: 'WEIHENSTEPHAN',
        Singapore: 'SINGAPORE'
    } as const;
    export type LocationEnum = typeof LocationEnum[keyof typeof LocationEnum];
    export const FundingTypeEnum = {
        FullyFunded: 'FULLY_FUNDED',
        PartiallyFunded: 'PARTIALLY_FUNDED',
        Scholarship: 'SCHOLARSHIP',
        SelfFunded: 'SELF_FUNDED',
        IndustrySponsored: 'INDUSTRY_SPONSORED',
        GovernmentFunded: 'GOVERNMENT_FUNDED',
        ResearchGrant: 'RESEARCH_GRANT'
    } as const;
    export type FundingTypeEnum = typeof FundingTypeEnum[keyof typeof FundingTypeEnum];
    export const StateEnum = {
        Draft: 'DRAFT',
        Published: 'PUBLISHED',
        Closed: 'CLOSED',
        ApplicantFound: 'APPLICANT_FOUND'
    } as const;
    export type StateEnum = typeof StateEnum[keyof typeof StateEnum];
}


