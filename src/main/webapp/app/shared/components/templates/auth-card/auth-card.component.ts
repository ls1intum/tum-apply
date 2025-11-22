import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { Login } from '../../organisms/login/login';
import { Registration } from '../../organisms/registration/registration';
import { AuthOrchestratorService } from '../../../../core/auth/auth-orchestrator.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [CommonModule, DividerModule, Login, Registration, ButtonComponent],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  readonly authOrchestrator = inject(AuthOrchestratorService);

  onClose(): void {
    this.authOrchestrator.close();
  }
}
