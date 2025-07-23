import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ContentChange, QuillEditorComponent } from 'ngx-quill';

import { BaseInputDirective } from '../base-input/base-input.component';

const STANDARD_CHARACTER_LIMIT = 500;
const STANDARD_CHARACTER_BUFFER = 50;

@Component({
  selector: 'jhi-editor',
  imports: [CommonModule, QuillEditorComponent, FontAwesomeModule, FormsModule, ReactiveFormsModule, TranslateModule, TooltipModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent extends BaseInputDirective<string> {
  characterCount = computed(() => this.extractTextFromHtml(this.htmlValue()).length);
  characterLimit = input<number | undefined>(STANDARD_CHARACTER_LIMIT); // Optionally set maximum character limit
  helperText = input<string | undefined>(undefined); // Optional helper text to display below the editor field
  // Check if error message should be displayed
  isTouched = signal(false);
  isOverCharLimit = signal(false);
  isEmpty = computed(() => this.extractTextFromHtml(this.htmlValue()) === '' && !this.isFocused() && this.isTouched());
  isInitialized = signal(false);

  errorMessage = computed(() => {
    this.langChange();

    if (this.isEmpty()) {
      return this.translate.instant('global.input.error.required');
    }
    if (this.isOverCharLimit()) {
      return this.translate.instant('global.input.error.maxLength', { max: this.characterLimit() });
    }
    return null;
  });

  charCounterColor = computed(() => {
    const count = this.characterCount();
    const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;
    const over = count - limit;

    if (over > 0 && over < STANDARD_CHARACTER_BUFFER) {
      return 'char-counter-warning';
    } else if (over >= STANDARD_CHARACTER_BUFFER) {
      return 'char-counter-danger';
    }
    return 'char-counter-normal'; // default character count color
  });

  editorValue = computed(() => {
    if (this.hasFormControl()) {
      return this.formControl().value ?? '';
    } else {
      return this.model();
    }
  });

  private htmlValue = signal('');
  private hasFormControl = computed(() => !!this.formControl());

  constructor() {
    super();

    effect(() => {
      const count = this.characterCount();
      const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;

      this.isOverCharLimit.set(count - limit >= STANDARD_CHARACTER_BUFFER);
    });
    effect(() => {
      if (!this.isInitialized()) {
        this.htmlValue.set(this.editorValue());
        this.isInitialized.set(true);
      }
    });
  }

  textChanged(event: ContentChange): void {
    const { source, oldDelta, editor } = event;

    const maxChars = (this.characterLimit() ?? STANDARD_CHARACTER_LIMIT) + STANDARD_CHARACTER_BUFFER;

    if (source !== 'user') return;
    const newTextLength = this.extractTextFromHtml(editor.root.innerHTML).length;
    if (newTextLength > maxChars) {
      const range = editor.getSelection();
      editor.setContents(oldDelta, 'silent');
      if (range) {
        editor.setSelection(range.index, range.length, 'silent');
      }
      return;
    }

    const html = editor.root.innerHTML;
    this.htmlValue.set(html);

    const ctrl = this.formControl();
    if (this.hasFormControl()) {
      if (ctrl.value !== html) {
        ctrl.patchValue(html, { emitEvent: false });
      }
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity();
    } else {
      this.modelChange.emit(html);
    }
    this.isTouched.set(true);
  }

  // Extract plain text from HTML
  private extractTextFromHtml(htmlText: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    return (temp.textContent ?? temp.innerText) || '';
  }
}

// TODO: add rows
// TODO: implement placeholder text as HTML
