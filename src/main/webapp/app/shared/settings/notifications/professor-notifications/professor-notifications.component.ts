import { Component, ViewEncapsulation } from '@angular/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'jhi-professor-notifications',
  imports: [DividerModule, ToggleSwitchModule],
  templateUrl: './professor-notifications.component.html',
  styleUrl: './professor-notifications.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ProfessorNotificationsComponent {}
