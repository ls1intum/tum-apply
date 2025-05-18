import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-tag',
  imports: [Tag, FontAwesomeModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  text = input<string>('');
  color = input<'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast'>('primary');
  icon = input<IconDefinition | undefined>(undefined);
  round = input<boolean>(false);
  iconRight = input<boolean>(false);

  readonly iconProp = computed(() => this.icon() as IconDefinition);
}
