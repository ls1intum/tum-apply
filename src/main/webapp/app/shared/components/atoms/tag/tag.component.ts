import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { injectTranslator } from 'app/shared/util/translate-signal.util';

@Component({
  selector: 'jhi-tag',
  imports: [Tag, FontAwesomeModule, TooltipModule],
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
  width = input<string | undefined>(undefined);
  shouldTranslate = input<boolean>(true);
  translationParams = input<Record<string, unknown>>({});

  readonly iconProp = computed(() => this.icon() as IconDefinition);
  readonly severity = computed(() => {
    const colorValue = this.color();
    return colorValue === 'primary' ? 'info' : colorValue;
  });

  displayText = computed(() => this.translator.translate(this.text(), this.shouldTranslate(), this.translationParams()) ?? '');
  displayTooltipText = computed(
    () => this.translator.translate(this.tooltipText(), this.shouldTranslate(), this.translationParams()) ?? '',
  );

  private translator = injectTranslator();
}
