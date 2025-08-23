import { Component, ViewEncapsulation, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import { Login } from '../../organisms/login/login';
import { Registration } from '../../organisms/registration/registration';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [CommonModule, DividerModule, RouterModule, Login, Registration],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthCardComponent {
  loginMode = signal<boolean>(true);

  toggleMode = (): void => {
    this.loginMode.update(v => !v);
  };
}
