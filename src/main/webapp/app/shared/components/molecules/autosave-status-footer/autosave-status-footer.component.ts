import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { SavingState, SavingStates } from 'app/shared/constants/saving-states';
import { StickyFooterShellComponent } from 'app/shared/components/molecules/sticky-footer-shell/sticky-footer-shell.component';

@Component({
  selector: 'jhi-autosave-status-footer',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule, StickyFooterShellComponent],
  templateUrl: './autosave-status-footer.component.html',
})
export class AutosaveStatusFooterComponent {
  savingState = input.required<SavingState>();

  readonly savingBadgeCalculatedClass = computed(
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${
        this.savingState() === SavingStates.SAVED
          ? 'text-positive-default'
          : this.savingState() === SavingStates.FAILED
            ? 'text-negative-default'
            : 'text-warning-default'
      }`,
  );
}
