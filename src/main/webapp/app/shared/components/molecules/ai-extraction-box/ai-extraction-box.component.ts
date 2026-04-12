import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ProgressSpinnerComponent } from '../../atoms/progress-spinner/progress-spinner.component';
import { AiConsentModalComponent } from 'app/shared/settings/ai-consent-settings/ai-consent-modal/ai-consent-modal.component';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';

@Component({
  selector: 'jhi-ai-extraction-box',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ProgressSpinnerComponent, AiConsentModalComponent],
  templateUrl: './ai-extraction-box.component.html',
})
export class AiExtractionBoxComponent {
  /** translation key for helper text shown at the top */
  helperTextKey = input<string>('');

  /** translation key for consent sentence shown next to the info button */
  consentTextKey = input<string>('');

  /** whether the extraction is currently running (shows spinner) */
  loading = input<boolean>(false);

  /** label translation key for the action button (if shouldTranslate is true) */
  buttonLabelKey = input<string>('entity.applicationPage1.aiExtractionButton');

  /** disables the action button when true */
  disabled = input<boolean>(false);

  /** emitted when user clicks the extract button */
  extract = output<void>();

  /** internal signal to control consent modal visibility */
  aiConsentVisible = signal<boolean>(false);

  protected readonly UserShortDTORolesEnum = UserShortDTORolesEnum;
}
