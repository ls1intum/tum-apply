import { Component } from '@angular/core';

import { AuthCardComponent } from '../../../shared/components/organisms/auth-card/auth-card.component';

/**
 * LoginComponent
 * --------------
 * This component displays a login screen and triggers Keycloak authentication flow.
 */
@Component({
  selector: 'jhi-login',
  imports: [AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {}
