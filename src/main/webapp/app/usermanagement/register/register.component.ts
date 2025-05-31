import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthCardComponent } from '../../shared/components/organisms/auth-card/auth-card.component';

@Component({
  selector: 'jhi-register',
  imports: [AuthCardComponent, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: true,
})
export class RegisterComponent {}
