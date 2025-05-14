import { Component, Input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-tag',
  imports: [Tag, FontAwesomeModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  @Input() text!: string;
  @Input() color: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' = 'primary';
  @Input() icon?: IconDefinition;
  @Input() round = false;
  @Input() iconRight = false;
}
