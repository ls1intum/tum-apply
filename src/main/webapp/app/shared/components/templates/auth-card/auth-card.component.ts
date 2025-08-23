import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import { Login } from '../../organisms/login/login';
import { Registration } from '../../organisms/registration/registration';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [CommonModule, DividerModule, Login, Registration],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthCardComponent {
  readonly authOrchestrator = inject(AuthOrchestratorService);
  loginMode = signal<boolean>(true);

  toggleMode = (): void => {
    this.loginMode.update(v => !v);
  };
}
