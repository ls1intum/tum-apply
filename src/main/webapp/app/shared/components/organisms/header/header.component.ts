import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isDarkMode = signal(document.body.classList.contains('tum-apply-dark-mode'));

  toggleColorScheme(): void {
    const className = 'tum-apply-dark-mode';
    document.body.classList.toggle(className);
    this.isDarkMode.set(document.body.classList.contains(className));
  }
}
