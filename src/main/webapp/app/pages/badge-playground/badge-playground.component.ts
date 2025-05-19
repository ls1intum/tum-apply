import { Component } from '@angular/core';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { TagComponent } from '../../shared/components/atoms/tag/tag.component';

@Component({
  selector: 'jhi-badge-playground',
  imports: [TagComponent, FontAwesomeModule],
  templateUrl: './badge-playground.component.html',
  styleUrl: './badge-playground.component.scss',
})
export class BadgePlaygroundComponent {
  testIcon = faCoffee;
}
