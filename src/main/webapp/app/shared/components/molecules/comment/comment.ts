import { Component, ViewEncapsulation, input, model, output, signal } from '@angular/core';
import { TextareaModule } from 'primeng/textarea';

import { ButtonComponent } from '../../atoms/button/button.component';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';

@Component({
  selector: 'jhi-comment',
  imports: [ButtonComponent, TextareaModule, TimeAgoPipe],
  templateUrl: './comment.html',
  styleUrl: './comment.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Comment {
  // Inputs
  text = model<string>('');
  author = input<string>('');
  createdAt = input<string>('');
  canEdit = input<boolean>(false);
  isCreate = input<boolean>(false);

  // Outputs
  saved = output<string>();

  // Internal Signals
  protected isEdit = signal<boolean>(false);
  protected draft = signal<string>('');

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
