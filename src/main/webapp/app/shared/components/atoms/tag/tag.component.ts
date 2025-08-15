import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { NgStyle } from '@angular/common';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-tag',
  imports: [Tag, FontAwesomeModule, NgStyle],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
  standalone: true,
})
export class TagComponent {
  text = input<string>('');
  color = input<'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast'>('primary');
  icon = input<IconDefinition | undefined>(undefined);
  round = input<boolean>(false);
  iconRight = input<boolean>(false);
  width = input<string | undefined>(undefined);

  readonly iconProp = computed(() => this.icon() as IconDefinition);

  widthStyle = computed(() => {
    if (this.width() != null) {
      return {
        width: this.width(),
      };
    }
    return undefined;
  });
}
