import { Component } from '@angular/core';

import { keycloakService } from '../../../core/auth/keycloak.service';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

/**
 * LoginComponent
 * --------------
 * This component displays a login screen and triggers Keycloak authentication flow.
 */
@Component({
  selector: 'jhi-login',
  imports: [ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  /**
   * Triggers the Keycloak login redirect.
   */
  login(): void {
    keycloakService.login();
  }
}
