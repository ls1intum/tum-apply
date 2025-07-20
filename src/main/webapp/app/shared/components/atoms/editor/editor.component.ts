import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorModule, EditorTextChangeEvent } from 'primeng/editor';
import Quill from 'quill';

import { BaseInputDirective } from '../base-input/base-input.component';

const STANDARD_CHARACTER_LIMIT = 500;
const STANDARD_CHARACTER_BUFFER = 50;

@Component({
  selector: 'jhi-editor',
  imports: [CommonModule, EditorModule, FontAwesomeModule, FormsModule, ReactiveFormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent extends BaseInputDirective<string> {
  characterCount = computed(() => this.extractTextFromHtml(this.htmlValue()).length);
  characterLimit = input<number | undefined>(STANDARD_CHARACTER_LIMIT); // Optionally set maximum character limit
  // Check if error message should be displayed
  isTouched = signal(false);
  isEmpty = computed(() => this.extractTextFromHtml(this.htmlValue()) === '' && !this.isFocused() && this.isTouched());

  editorElem = viewChild<ElementRef<HTMLElement>>('editorElem');

  constructor() {
    super();

    effect(() => {
      const host = this.editorElem();
      if (!host) return;
      this.waitForQuillReady(host.nativeElement);
    });
  }

  private waitForQuillReady(container: HTMLElement, retries = 20): void {
    const el = container.querySelector('.ql-container');
    if (!el) {
      if (retries <= 0) {
        console.error('.ql-editor never appeared in DOM');
        return;
      }
      requestAnimationFrame(() => this.waitForQuillReady(container, retries - 1));
      return;
    }

    const maybeQuill = Quill.find(el);
    if (!(maybeQuill instanceof Quill)) {
      console.error('Found a Blot instead of a Quill instance');
      return;
    }

    const quill = maybeQuill;
    const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;
    const maxChars = limit + STANDARD_CHARACTER_BUFFER;

    quill.on('text-change', (_delta, oldDelta) => {
      const text = this.extractTextFromHtml(quill.root.innerHTML);
      if (text.length > maxChars) {
        quill.updateContents(oldDelta);
      }
    });

    console.info('Quill initialized and listener attached');
  }

  errorMessage = computed(() => {
    this.langChange();

    if (this.isEmpty()) {
      return this.translate.instant('global.input.error.required');
    }
    // TODO: Add error message for writing more than max char limit
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

  private htmlValue = signal('');
  private lastValidValue = signal<string>('');

  onInputChange(event: EditorTextChangeEvent): void {
    const proposedValue = event.htmlValue;
    const proposedText = this.extractTextFromHtml(proposedValue);
    const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;
    const maxAllowed = limit + STANDARD_CHARACTER_BUFFER;
    const ctrl = this.formControl();

    if (proposedText.length > maxAllowed) {
      // Revert to last valid value
      const previousHtml = this.lastValidValue();

      // Force editor and form control to revert
      this.htmlValue.set(previousHtml);
      ctrl.setValue(previousHtml);
      ctrl.updateValueAndValidity();

      this.modelChange.emit(previousHtml);
      return;
    }

    // Input is valid, update value
    this.lastValidValue.set(proposedValue);
    this.htmlValue.set(proposedValue);
    this.modelChange.emit(proposedValue);

    ctrl.setValue(proposedValue);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
    this.isTouched.set(true);
  }

  // Extract plain text from HTML
  private extractTextFromHtml(htmlText: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    return (temp.textContent ?? temp.innerText) || '';
  }
}
