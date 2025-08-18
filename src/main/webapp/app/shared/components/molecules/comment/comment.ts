import { Component, ViewEncapsulation, input, model, output, signal } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';

import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-comment',
  imports: [ButtonComponent, TextareaModule],
  templateUrl: './comment.html',
  styleUrl: './comment.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Comment {
  text = model<string>('');
  canEdit = input<boolean>(false);

  saved = output<string>();

  isEdit = signal<boolean>(false);
  draft = signal<string>('');

  startEdit(): void {
    this.draft.set(this.text());
    this.isEdit.set(true);
  }

  onInput(e: Event): void {
    this.draft.set((e.target as HTMLTextAreaElement).value);
  }

  onCancel(): void {
    this.isEdit.set(false);
    this.draft.set(this.text());
  }

  onSave(): void {
    const value = this.draft();
    this.saved.emit(value);
    this.text.set(value);
    this.isEdit.set(false);
  }
}
