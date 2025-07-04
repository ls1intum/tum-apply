/**
 * OpenAPI definition
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { ResearchGroupShortDTO } from './researchGroupShortDTO';


export interface UserShortDTO { 
    userId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: Array<UserShortDTO.RolesEnum>;
    researchGroup?: ResearchGroupShortDTO;
}
export namespace UserShortDTO {
    export type RolesEnum = 'APPLICANT' | 'PROFESSOR' | 'ADMIN';
    export const RolesEnum = {
        Applicant: 'APPLICANT' as RolesEnum,
        Professor: 'PROFESSOR' as RolesEnum,
        Admin: 'ADMIN' as RolesEnum
    };
}


