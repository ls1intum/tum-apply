export * from './applicationEvaluationResource.service';
import { ApplicationEvaluationResourceService } from './applicationEvaluationResource.service';
export * from './applicationResource.service';
import { ApplicationResourceService } from './applicationResource.service';
export * from './documentResource.service';
import { DocumentResourceService } from './documentResource.service';
export * from './jobResource.service';
import { JobResourceService } from './jobResource.service';
export const APIS = [ApplicationEvaluationResourceService, ApplicationResourceService, DocumentResourceService, JobResourceService];
