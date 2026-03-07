import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateDirective } from 'app/shared/language';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { AiScoreRingComponent } from 'app/shared/components/atoms/ai-score-ring/ai-score-ring.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-ai-assistant-card',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    TranslateModule,
    TranslateDirective,
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

  onGenerate(): void {
    this.generate.emit();
  }
}
