import { Component, computed, input, output } from '@angular/core';
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
  closable = input<boolean>(true);
  showHeader = input<boolean>(true);
  styleClass = input<string>('');
  contentStyleClass = input<string>('');
  contentStyle = input<Record<string, string>>({});
  style = input<Record<string, string>>({});

  visibleChange = output<boolean>();

  mergedStyle = computed(() => {
    const baseStyle = {
      width: this.width(),
      maxWidth: this.maxWidth(),
      height: this.height(),
    };
    return Object.assign({}, baseStyle, this.style());
  });

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }
}
