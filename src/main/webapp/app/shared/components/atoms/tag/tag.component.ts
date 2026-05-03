import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Tag } from 'primeng/tag';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateService } from '@ngx-translate/core';

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

  readonly iconProp = computed(() => this.icon() as IconDefinition);
  readonly severity = computed(() => {
    const colorValue = this.color();
    return colorValue === 'primary' ? 'info' : colorValue;
  });

  displayText = computed(() => this.translate(this.text()));
  displayTooltipText = computed(() => this.translate(this.tooltipText()));

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  private translate(value: string | undefined): string {
    this.langChange();
    if (value === undefined || value === '') {
      return value ?? '';
    }
    return this.shouldTranslate() ? this.translateService.instant(value) : value;
  }
}
