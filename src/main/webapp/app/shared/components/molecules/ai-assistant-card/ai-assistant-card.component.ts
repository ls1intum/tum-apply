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
  score = input<number | null>(null);
  isGenerating = input<boolean>(false);
  isAnalyzing = input<boolean>(false);
  isRewriteMode = input<boolean>(false);
  buttonIcon = input<string>('custom-sparkle');
  generate = output();

  readonly WARNING_THRESHOLD = 50;
  readonly DANGER_THRESHOLD = 29;
  readonly EXCELLENCE_THRESHOLD = 90;
  readonly displayedScore = signal<number | null>(null);
  readonly scoreDialogVisible = signal(false);

  /** Whether the score ring should appear greyed out (generating or analyzing) */
  readonly isScoreLoading = computed(() => this.isGenerating() || this.isAnalyzing());

  readonly boundedScore = computed(() => {
    const value = this.score();
    if (value === null || !Number.isFinite(value)) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
  });

  readonly scoreFeedback = computed(() => {
    const score = this.displayedScore();
    if (score === null) {
      return 'jobCreationForm.positionDetailsSection.jobDescription.aiScoreFeedback.pending';
    }

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

  private readonly displayedScoreEffect = effect(() => {
    const loading = this.isScoreLoading();
    const score = this.boundedScore();

    if (loading) {
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
