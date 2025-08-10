import { Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonColor, ButtonComponent } from '../button/button.component';

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
  header = input<string | undefined>(undefined);
  message = input<string | undefined>(undefined);
  severity = input<ButtonColor>('primary');

  data = input<string | undefined>(undefined);

  confirmed = output<unknown>();

  private confirmationService = inject(ConfirmationService);

  confirm(): void {
    this.confirmationService.confirm({
      message: this.message(),
      header: this.header(),
      accept: () => {
        this.confirmed.emit(this.data());
      },
    });
  }
}
