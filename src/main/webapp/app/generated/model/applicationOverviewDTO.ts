/**
 * OpenAPI definition
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface ApplicationOverviewDTO { 
    applicationId?: string;
    jobTitle?: string;
    researchGroup?: string;
    applicationState?: ApplicationOverviewDTO.ApplicationStateEnum;
    timeSinceCreation?: string;
}
export namespace ApplicationOverviewDTO {
    export const ApplicationStateEnum = {
        Saved: 'SAVED',
        Sent: 'SENT',
        Accepted: 'ACCEPTED',
        InReview: 'IN_REVIEW',
        Rejected: 'REJECTED',
        Withdrawn: 'WITHDRAWN',
        JobClosed: 'JOB_CLOSED'
    } as const;
    export type ApplicationStateEnum = typeof ApplicationStateEnum[keyof typeof ApplicationStateEnum];
}


