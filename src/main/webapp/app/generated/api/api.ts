export * from './accountResource.service';
import { AccountResourceService } from './accountResource.service';
export * from './actuator.service';
import { ActuatorService } from './actuator.service';
export * from './applicationEvaluationResource.service';
import { ApplicationEvaluationResourceService } from './applicationEvaluationResource.service';
export * from './applicationResource.service';
import { ApplicationResourceService } from './applicationResource.service';
export * from './jobResource.service';
import { JobResourceService } from './jobResource.service';
export const APIS = [
  AccountResourceService,
  ActuatorService,
  ApplicationEvaluationResourceService,
  ApplicationResourceService,
  JobResourceService,
];
