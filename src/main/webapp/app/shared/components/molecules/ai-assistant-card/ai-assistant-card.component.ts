import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { AiScoreRingComponent } from 'app/shared/components/atoms/ai-score-ring/ai-score-ring.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-ai-assistant-card',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    TranslateModule,
    TranslateDirective,
    DialogComponent,
    TooltipModule,
    ButtonComponent,
    ProgressSpinnerComponent,
    AiScoreRingComponent,
  ],
  templateUrl: './ai-assistant-card.component.html',
})
export class AiAssistantCardComponent {
  score = input<number>(0);
  isGenerating = input<boolean>(false);
  isRewriteMode = input<boolean>(false);
  buttonIcon = input<string>('custom-sparkle');
  generate = output();

  readonly WARNING_THRESHOLD = 65;
  readonly DANGER_THRESHOLD = 29;
  readonly EXCELLENCE_THRESHOLD = 90;
  readonly displayedScore = signal(0);
  readonly scoreDialogVisible = signal(false);

  readonly boundedScore = computed(() => {
    const value = this.score();
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
  });

  readonly scoreFeedback = computed(() => {
    const score = this.displayedScore();

    if (score <= this.DANGER_THRESHOLD) {
      return 'jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.critical';
    }

    if (score <= this.WARNING_THRESHOLD) {
      return 'jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.warning';
    }

    if (score >= this.EXCELLENCE_THRESHOLD) {
      return 'jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.excellent';
    }

    return 'jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.good';
  });

  private wasGenerating = false;

  private readonly displayedScoreEffect = effect(() => {
    const generating = this.isGenerating();
    const score = this.boundedScore();

    if (generating) {
      this.wasGenerating = true;
      return;
    }

    // Skip the immediate update right after generation ends — the analysis
    // API hasn't responded yet, so calculateScore returns 100 as a fallback.
    // The real score will arrive once the analysis completes.
    if (this.wasGenerating) {
      this.wasGenerating = false;
      return;
    }

    this.displayedScore.set(score);
  });

  onGenerate(): void {
    this.generate.emit();
  }

  openScoreDialog(): void {
    this.scoreDialogVisible.set(true);
  }

  onScoreDialogVisibleChange(isVisible: boolean): void {
    this.scoreDialogVisible.set(isVisible);
  }
}
