export * from './accountResource.service';
import { AccountResourceService } from './accountResource.service';
export * from './actuator.service';
import { ActuatorService } from './actuator.service';
export * from './authInfoResource.service';
import { AuthInfoResourceService } from './authInfoResource.service';
export * from './authorityResource.service';
import { AuthorityResourceService } from './authorityResource.service';
export * from './jobResource.service';
import { JobResourceService } from './jobResource.service';
export * from './logoutResource.service';
import { LogoutResourceService } from './logoutResource.service';
export const APIS = [
  AccountResourceService,
  ActuatorService,
  AuthInfoResourceService,
  AuthorityResourceService,
  JobResourceService,
  LogoutResourceService,
];
