import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { keycloakService } from '../../../core/auth/keycloak.service';
import { AuthCardComponent } from '../../../shared/components/organisms/auth-card/auth-card.component';

/**
 * LoginComponent
 * --------------
 * This component displays a login screen and triggers Keycloak authentication flow.
 * If the user is already logged in, they will be redirected to the home page.
 */
@Component({
  selector: 'jhi-login',
  imports: [AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    if (keycloakService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }
}
