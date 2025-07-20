export * from './applicationEvaluationResource.service';
import {ApplicationEvaluationResourceService} from './applicationEvaluationResource.service';
import {ApplicationResourceService} from './applicationResource.service';
import {DocumentResourceService} from './documentResource.service';
import {EmailLoginResourceService} from './emailLoginResource.service';
import {EmailSettingResourceService} from './emailSettingResource.service';
import {JobResourceService} from './jobResource.service';
import {UserResourceService} from './userResource.service';

export * from './applicationResource.service';
export * from './documentResource.service';
export * from './emailLoginResource.service';
export * from './emailSettingResource.service';
export * from './jobResource.service';
export * from './userResource.service';
export const APIS = [ApplicationEvaluationResourceService, ApplicationResourceService, DocumentResourceService, EmailLoginResourceService, EmailSettingResourceService, JobResourceService, UserResourceService];
