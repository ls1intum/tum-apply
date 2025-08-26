import { Component, ViewEncapsulation, effect, input, model, output, signal } from '@angular/core';
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
  deleted = output();

  // Internal
  protected isEdit = signal<boolean>(false);
  protected draft = model<string>('');

  protected _updateDraftEffect = effect(() => {
    const incoming = this.text();
    const editing = this.isEdit();
    const creating = this.isCreate();

    // In create mode, or whenever not editing, mirror incoming text into draft
    if (creating || !editing) {
      this.draft.set(incoming);
    }
  });

  onInput(e: Event): void {
    const value = (e.target as HTMLTextAreaElement).value;
    this.draft.set(value);

    if (this.isCreate()) {
      this.text.set(value);
    }
  }

  startEdit(): void {
    this.draft.set(this.text());
    this.isEdit.set(true);
  }

  onCancel(): void {
    this.isEdit.set(false);
    this.draft.set(this.text());
  }

  onSave(): void {
    const value = this.draft();
    this.saved.emit(value);

    this.isEdit.set(false);
  }
}
