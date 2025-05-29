import { bootstrapApplication } from '@angular/platform-browser';

import AppComponent from './app/app.component';
import { appConfig } from './app/app.config';
import { keycloakService } from './app/core/auth/keycloak.service';

keycloakService.init().then(() => {
  bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => console.error(err));
});
