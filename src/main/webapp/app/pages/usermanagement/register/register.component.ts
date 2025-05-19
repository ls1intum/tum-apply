import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthCardComponent } from '../../../shared/components/organisms/auth-card/auth-card.component';
import { keycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'jhi-register',
  imports: [AuthCardComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    if (keycloakService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }
}
