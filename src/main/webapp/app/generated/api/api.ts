export * from './actuator.service';
import { ActuatorService } from './actuator.service';
export * from './applicationEvaluationResource.service';
import { ApplicationEvaluationResourceService } from './applicationEvaluationResource.service';
export * from './applicationResource.service';
import { ApplicationResourceService } from './applicationResource.service';
export * from './jobResource.service';
import { JobResourceService } from './jobResource.service';
export * from './userResource.service';
import { UserResourceService } from './userResource.service';
export const APIS = [
  ActuatorService,
  ApplicationEvaluationResourceService,
  ApplicationResourceService,
  JobResourceService,
  UserResourceService,
];
