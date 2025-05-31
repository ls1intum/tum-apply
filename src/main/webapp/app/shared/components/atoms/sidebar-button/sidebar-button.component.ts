import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-sidebar-button',
  imports: [FontAwesomeModule],
  templateUrl: './sidebar-button.component.html',
  styleUrl: './sidebar-button.component.scss',
})
export class SidebarButtonComponent {
  icon = input<string | undefined>(undefined);
  label = input<string>('');
  isActive = input<boolean>(false);
}
