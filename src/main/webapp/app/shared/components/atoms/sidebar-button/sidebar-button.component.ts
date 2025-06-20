import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'jhi-sidebar-button',
  imports: [FontAwesomeModule],
  templateUrl: './sidebar-button.component.html',
  styleUrl: './sidebar-button.component.scss',
})
export class SidebarButtonComponent {
  icon = input<string | undefined>(undefined);
  label = input<string>('');
  isActive = input<boolean>(false);
  link = input<string>('/');

  constructor(private router: Router) {}

  navigate(): void {
    this.router.navigate([this.link()]).catch((err: unknown) => {
      console.error('Navigation error:', err);
    });
  }
}
