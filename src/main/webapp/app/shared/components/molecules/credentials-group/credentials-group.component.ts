import { Component } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';

import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-credentials-group',
  standalone: true,
  imports: [ButtonComponent, StringInputComponent, PasswordModule, FormsModule],
  templateUrl: './credentials-group.component.html',
  styleUrl: './credentials-group.component.scss',
})
export class CredentialsGroupComponent {
  username = '';
  password = '';
  disabled = this.username === '' || this.password === '';
}
