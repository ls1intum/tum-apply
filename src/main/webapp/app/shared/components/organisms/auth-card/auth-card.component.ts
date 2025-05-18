import { Component, Input } from '@angular/core';
import { TabsModule } from 'primeng/tabs';

import { ButtonComponent } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../molecules/button-group/button-group.component';
import { keycloakService } from '../../../../core/auth/keycloak.service';

@Component({
  selector: 'jhi-auth-card',
  standalone: true,
  imports: [ButtonComponent, ButtonGroupComponent, TabsModule],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  @Input() mode: 'login' | 'register' = 'login';
  value = 0;

  studentButtons(): ButtonGroupData {
    return {
      direction: 'vertical',
      buttons: [
        {
          label: this.mode === 'register' ? 'Register with Microsoft' : 'Sign in with Microsoft',
          icon: 'microsoft',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
        {
          label: this.mode === 'register' ? 'Register with Apple' : 'Sign in with Apple',
          icon: 'apple',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
        {
          label: this.mode === 'register' ? 'Register with Google' : 'Sign in with Google',
          icon: 'google',
          severity: 'secondary',
          disabled: true,
          onClick() {},
        },
      ],
    };
  }

  onTUMSSOLogin(): void {
    keycloakService.login();
  }
}
