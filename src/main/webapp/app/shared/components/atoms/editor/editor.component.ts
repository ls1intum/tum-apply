import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorModule, EditorTextChangeEvent } from 'primeng/editor';
import Quill from 'quill';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

import { BaseInputDirective } from '../base-input/base-input.component';

const STANDARD_CHARACTER_LIMIT = 500;
const STANDARD_CHARACTER_BUFFER = 50;

@Component({
  selector: 'jhi-editor',
  imports: [CommonModule, EditorModule, FontAwesomeModule, FormsModule, ReactiveFormsModule, TranslateModule, TooltipModule],
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

  editorElem = viewChild<ElementRef<HTMLElement>>('editorElem');

  constructor() {
    super();

    effect(() => {
      const count = this.characterCount();
      const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;

      this.isOverCharLimit.set(count - limit >= STANDARD_CHARACTER_BUFFER);
    });

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

    const maxChars = (this.characterLimit() ?? STANDARD_CHARACTER_LIMIT) + STANDARD_CHARACTER_BUFFER;

    let isReverting = false;

    // Initialize the editor with the initial value from the model
    const initialValue = this.model();
    if (initialValue !== undefined) {
      this.htmlValue.set(initialValue);
    }

    quill.on('text-change', (delta, oldDelta, source) => {
      if (isReverting || source !== 'user') return;

      const isInsert = delta.ops?.some(op => typeof op.insert === 'string');
      const currentText = this.extractTextFromHtml(quill.root.innerHTML);

      if (isInsert && currentText.length > maxChars) {
        isReverting = true;
        quill.setContents(oldDelta, 'silent');

        const html = quill.root.innerHTML;
        const ctrl = this.formControl();
        this.modelChange.emit(html);
        this.htmlValue.set(html);
        // ctrl.setValue(html);
        ctrl.markAsDirty();
        ctrl.updateValueAndValidity();
        this.isTouched.set(true);

        isReverting = false;
        return;
      }

      const html = quill.root.innerHTML;
      const ctrl = this.formControl();
      this.modelChange.emit(html);
      this.htmlValue.set(html);
      // ctrl.setValue(html);
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity();
      this.isTouched.set(true);
    });

    console.info('Quill initialized and listener attached');
  }

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

  private htmlValue = signal('');
  private lastValidValue = signal<string>('');

  // Extract plain text from HTML
  private extractTextFromHtml(htmlText: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    return (temp.textContent ?? temp.innerText) || '';
  }
}

//TODO: add rows
//TODO: implement placeholder text as HTML
