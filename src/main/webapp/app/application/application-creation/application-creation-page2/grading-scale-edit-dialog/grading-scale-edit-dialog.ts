import { Component, computed, inject, signal } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-grading-scale-edit-dialog',
  standalone: true,
  imports: [TranslateModule, ButtonComponent, StringInputComponent, FontAwesomeModule, TooltipModule],
  templateUrl: './grading-scale-edit-dialog.html',
})
export class GradingScaleEditDialogComponent {
  config = inject(DynamicDialogConfig);
  ref = inject(DynamicDialogRef);

  upperLimit = signal(this.config.data?.currentUpperLimit ?? '');
  lowerLimit = signal(this.config.data?.currentLowerLimit ?? '');

  isValid = computed(() => {
    const upper = this.upperLimit().trim();
    const lower = this.lowerLimit().trim();

    return upper !== '' && lower !== '';
  });

  onSwap(): void {
    const upper = this.upperLimit();
    const lower = this.lowerLimit();

    this.upperLimit.set(lower);
    this.lowerLimit.set(upper);
  }

  onSave(): void {
    if (this.isValid()) {
      this.ref.close({
        upperLimit: this.upperLimit(),
        lowerLimit: this.lowerLimit(),
      });
    }
  }

  onCancel(): void {
    this.ref.close();
  }
}
