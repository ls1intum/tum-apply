import { Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-dialog',
  templateUrl: './dialog.component.html',
  standalone: true,
  imports: [DialogModule, TranslateModule],
})
export class DialogComponent {
  visible = input<boolean>(false);
  header = input<string>('');
  shouldTranslateHeader = input<boolean>(true);
  width = input<string>('50vw');
  maxWidth = input<string>('none');
  height = input<string>('auto');
  modal = input<boolean>(true);
  draggable = input<boolean>(false);
  resizable = input<boolean>(false);
  dismissableMask = input<boolean>(true);
  closeOnEscape = input<boolean>(true);
  contentStyleClass = input<string>('');
  contentStyle = input<Record<string, string>>({});

  visibleChange = output<boolean>();

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }
}
