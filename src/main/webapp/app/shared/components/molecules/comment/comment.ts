import { Component, ViewEncapsulation, computed, effect, input, model, output } from '@angular/core';
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
  commentId = input<string | undefined>(undefined);
  editingId = input<string | undefined>(undefined);

  text = model<string>('');
  author = input<string>('');
  createdAt = input<string>('');
  canEdit = input<boolean>(false);
  isCreate = input<boolean>(false);

  saved = output<string>();
  deleted = output();
  enterEdit = output();
  exitEdit = output();

  protected draft = model<string>('');

  protected canSave = computed<boolean>(() => {
    if (this.isCreate()) return this.draft().length > 0;
    if (!this.isEdit()) return false;
    return this.draft() !== this.text() && this.draft().length > 0;
  });

  protected isEdit = computed<boolean>(() => {
    return !this.isCreate() && this.commentId() !== undefined && this.editingId() === this.commentId();
  });

  protected _updateDraftEffect = effect(() => {
    const incoming = this.text();
    const editing = this.isEdit();
    const creating = this.isCreate();

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
    this.enterEdit.emit();
  }

  onCancel(): void {
    this.exitEdit.emit();
  }

  onSave(): void {
    this.saved.emit(this.draft());
    this.exitEdit.emit();
  }
}
