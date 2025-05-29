import { Component } from '@angular/core';

import { AuthCardComponent } from '../../shared/components/organisms/auth-card/auth-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-register',
  imports: [AuthCardComponent, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: true,
})
export class RegisterComponent {}
