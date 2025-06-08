import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthCardComponent } from '../../shared/components/organisms/auth-card/auth-card.component';

/**
 * LoginComponent
 * --------------
 * This component displays a login screen and triggers Keycloak authentication flow.
 */
@Component({
  selector: 'jhi-login',
  imports: [AuthCardComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent {}
