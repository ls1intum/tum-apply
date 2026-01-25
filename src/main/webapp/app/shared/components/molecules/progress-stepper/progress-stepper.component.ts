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
import { TranslateModule } from '@ngx-translate/core';
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
  imports: [CommonModule, StepperModule, ButtonGroupComponent, TranslateModule, TranslateDirective],
  templateUrl: './progress-stepper.component.html',
  styleUrl: './progress-stepper.component.scss',
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

  private destroyRef = inject(DestroyRef);

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

  /**
   * Encapsulates the scrolling logic.
   * Uses setTimeout to allow the view to update before scrolling.
   */
  private scrollToTop(): void {
    setTimeout(() => {
      document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
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
}
