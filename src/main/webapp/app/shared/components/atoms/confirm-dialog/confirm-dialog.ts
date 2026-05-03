import { Component, ViewEncapsulation, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonColor, ButtonComponent, ButtonSize, ButtonVariant } from '../button/button.component';

@Component({
  selector: 'jhi-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  providers: [ConfirmationService],
  imports: [ConfirmDialogModule, ButtonComponent, FontAwesomeModule],
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmDialog {
  label = input<string | undefined>(undefined);
  iconOnly = input<boolean>(false);
  header = input<string | undefined>(undefined);
  message = input<string | undefined>(undefined);
  messageParams = input<Record<string, unknown>>({});
  confirmIcon = input<string | undefined>(undefined);
  severity = input<ButtonColor>('primary');
  variant = input<ButtonVariant>();
  showOpenButton = input<boolean>(true);
  visible = input(false);
  tooltip = input<string | undefined>(undefined);
  tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');
  disabled = input<boolean>(false);
  size = input<ButtonSize>('lg');
  shouldTranslate = input<boolean>(true);

  data = input<string | undefined>(undefined);

  // Input for sizing
  dialogStyleClass = input<string | undefined>(undefined);

  confirmed = output<unknown>();
  closed = output();

  displayHeader = computed(() => this.translate(this.header()));
  displayMessage = computed(() => this.translate(this.message(), this.messageParams()));

  private confirmationService = inject(ConfirmationService);
  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  // Opens the dialog declaratively when visible becomes true
  private visibleEffect = effect(() => {
    if (this.visible()) {
      this.openDialog();
    }
  });

  confirm(): void {
    this.openDialog();
  }

  private openDialog(): void {
    this.confirmationService.confirm({
      message: this.displayMessage(),
      header: this.displayHeader(),
      dismissableMask: true,
      closeOnEscape: true,
      accept: () => {
        this.confirmed.emit(this.data());
        this.closed.emit();
      },
      reject: () => {
        this.closed.emit();
      },
    });
  }

  private translate(value: string | undefined, params: Record<string, unknown> = {}): string | undefined {
    this.langChange();
    if (value === undefined) {
      return undefined;
    }
    return this.shouldTranslate() ? this.translateService.instant(value, params) : value;
  }
}
