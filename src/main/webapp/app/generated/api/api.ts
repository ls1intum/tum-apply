export * from './applicationEvaluationResource.service';
import { ApplicationEvaluationResourceService } from './applicationEvaluationResource.service';
export * from './applicationResource.service';
import { ApplicationResourceService } from './applicationResource.service';
export * from './documentResource.service';
import { DocumentResourceService } from './documentResource.service';
export * from './emailLoginResource.service';
import { EmailLoginResourceService } from './emailLoginResource.service';
export * from './emailSettingResource.service';
import { EmailSettingResourceService } from './emailSettingResource.service';
export * from './jobResource.service';
import { JobResourceService } from './jobResource.service';
export * from './userResource.service';
import { UserResourceService } from './userResource.service';
export const APIS = [
  ApplicationEvaluationResourceService,
  ApplicationResourceService,
  DocumentResourceService,
  EmailLoginResourceService,
  EmailSettingResourceService,
  JobResourceService,
  UserResourceService,
];
