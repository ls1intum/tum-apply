import { Component, computed, effect, input, signal } from '@angular/core';

@Component({
  selector: 'jhi-ai-score-ring',
  standalone: true,
  templateUrl: './ai-score-ring.component.html',
})
export class AiScoreRingComponent {
  score = input<number>(0);

  readonly WARNING_THRESHOLD = 50;
  readonly DANGER_THRESHOLD = 29;
  readonly RING_CIRCUMFERENCE = 94.2;
  readonly animatedScore = signal(0);

  readonly boundedScore = computed(() => {
    const value = this.score();
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
  });

  readonly strokeOffset = computed(() => this.RING_CIRCUMFERENCE - (this.animatedScore() / 100) * this.RING_CIRCUMFERENCE);

  readonly scoreColor = computed(() => {
    const score = this.animatedScore();

    if (score <= this.DANGER_THRESHOLD) {
      return 'var(--p-danger-color)';
    }

    if (score <= this.WARNING_THRESHOLD) {
      return 'var(--color-amber-200)';
    }

    return 'var(--p-primary-color)';
  });

  private animationEffect = effect(onCleanup => {
    const targetScore = this.boundedScore();
    let currentScore = this.animatedScore();

    if (targetScore === currentScore) {
      return;
    }

    const step = targetScore > currentScore ? 1 : -1;
    const animate = (): void => {
      currentScore += step;
      this.animatedScore.set(currentScore);

      if (currentScore !== targetScore) {
        frameId = globalThis.requestAnimationFrame(animate);
      }
    };

    let frameId = globalThis.requestAnimationFrame(animate);

    onCleanup(() => {
      globalThis.cancelAnimationFrame(frameId);
    });
  });
}
