export * from './applicationEvaluationResource.service';
import { ApplicationEvaluationResourceService } from './applicationEvaluationResource.service';
import { ApplicationResourceService } from './applicationResource.service';
import { AuthenticationResourceService } from './authenticationResource.service';
import { DocumentResourceService } from './documentResource.service';
import { EmailSettingResourceService } from './emailSettingResource.service';
import { JobResourceService } from './jobResource.service';
import { UserResourceService } from './userResource.service';

export * from './applicationResource.service';
export * from './authenticationResource.service';
export * from './documentResource.service';
export * from './emailSettingResource.service';
export * from './jobResource.service';
export * from './userResource.service';
export const APIS = [ApplicationEvaluationResourceService, ApplicationResourceService, AuthenticationResourceService, DocumentResourceService, EmailSettingResourceService, JobResourceService, UserResourceService];
