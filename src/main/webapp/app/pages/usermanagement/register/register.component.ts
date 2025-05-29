import { Component } from '@angular/core';

import { AuthCardComponent } from '../../../shared/components/organisms/auth-card/auth-card.component';

@Component({
  selector: 'jhi-register',
  imports: [AuthCardComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {}
