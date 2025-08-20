import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-tag',
  imports: [Tag, FontAwesomeModule, TooltipModule, TranslateModule],
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
  tooltipText = input<string | undefined>(undefined);

  readonly iconProp = computed(() => this.icon() as IconDefinition);
}
