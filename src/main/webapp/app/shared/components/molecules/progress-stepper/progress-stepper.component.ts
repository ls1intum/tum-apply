import {
  Component,
  DestroyRef,
  ElementRef,
  Signal,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateDirective } from 'app/shared/language';

import { Button } from '../../atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../button-group/button-group.component';

/**
 * Represents a button used in the stepper, extending the base Button type.
 * Optionally includes a flag to indicate whether the panel should change.
 */
export type StepButton = Button & {
  changePanel: boolean;
};

export type StepData = {
  name: string;
  panelTemplate: TemplateRef<any>;
  buttonGroupPrev: StepButton[];
  buttonGroupNext: StepButton[];
  status?: TemplateRef<HTMLDivElement>;
  shouldTranslate?: boolean;
  disabled?: boolean;
};

@Component({
  selector: 'jhi-progress-stepper',
  imports: [CommonModule, StepperModule, ButtonGroupComponent, TranslateDirective, TooltipModule],
  templateUrl: './progress-stepper.component.html',
  standalone: true,
})
export class ProgressStepperComponent {
  currentStep = signal<number>(1);
  steps = input<StepData[]>([]);

  shouldTranslate = input<boolean | undefined>(undefined);

  /** Tracks whether the sticky footer is at the actual bottom of the page */
  isAtBottom = signal<boolean>(false);

  bottomSentinel = viewChild<ElementRef<HTMLDivElement>>('bottomSentinel');

  buttonGroupPrev: Signal<ButtonGroupData> = computed(() =>
    this.buildButtonGroupData(this.steps()[this.currentStep() - 1].buttonGroupPrev, 'prev', this.currentStep()),
  );

  statusDiv: Signal<TemplateRef<HTMLDivElement> | undefined> = computed(() => this.steps()[this.currentStep() - 1].status);

  buttonGroupNext: Signal<ButtonGroupData> = computed(() =>
    this.buildButtonGroupData(this.steps()[this.currentStep() - 1].buttonGroupNext, 'next', this.currentStep()),
  );

  stepTooltips: Signal<string[]> = computed(() => {
    this.langChange();
    return this.steps().map(step => ((step.shouldTranslate ?? false) ? this.translateService.instant(step.name) : step.name));
  });

  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  constructor() {
    afterNextRender(() => {
      const sentinel = this.bottomSentinel()?.nativeElement;
      if (sentinel) {
        const observer = new IntersectionObserver(
          entries => {
            // When sentinel is visible, sticky bottom is at actual bottom
            this.isAtBottom.set(entries[0].isIntersecting);
          },
          { threshold: 0 },
        );
        observer.observe(sentinel);
        this.destroyRef.onDestroy(() => {
          observer.disconnect();
        });
      }
    });
  }

  goToStep(index: number): void {
    if (index > 0 && index <= this.steps().length) {
      this.currentStep.set(index);
      this.scrollToTop();
    }
  }

  buildButtonGroupData(steps: StepButton[], action: 'prev' | 'next', index: number): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: steps.map(button => {
        return {
          ...button,
          onClick: () => {
            button.onClick();
            if (button.changePanel) {
              if (action === 'next') {
                this.goToStep(index + 1);
              } else {
                this.goToStep(index - 1);
              }
            }
          },
        };
      }),
    };
  }

  private scrollToTop(): void {
    // Uses timeout to allow the view to update before scrolling.
    setTimeout(() => {
      document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
  }
}
