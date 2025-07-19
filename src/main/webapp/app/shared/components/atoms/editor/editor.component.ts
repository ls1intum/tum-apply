import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorModule, EditorTextChangeEvent } from 'primeng/editor';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-editor',
  imports: [CommonModule, EditorModule, FontAwesomeModule, FormsModule, ReactiveFormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent extends BaseInputDirective<string> {
  characterCount = computed(() => this.extractTextFromHtml(this.htmlValue()).length);
  characterLimit = input<number | undefined>(500); // Optionally set maximum character limit
  // Check if error message should be displayed
  isTouched = signal(false);
  isEmpty = computed(() => this.extractTextFromHtml(this.htmlValue()) === '' && !this.isFocused() && this.isTouched());

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
    const limit = this.characterLimit() ?? 500;
    const over = count - limit;

    if (over > 0 && over < 50) {
      return 'char-counter-warning';
    } else if (over >= 50) {
      return 'char-counter-danger';
    }
    return 'char-counter-normal'; // default character count color
  });

  private htmlValue = signal('');

  onInputChange(event: EditorTextChangeEvent): void {
    const value = event.htmlValue;
    this.htmlValue.set(value); // update HTML signal

    this.modelChange.emit(value);
    const ctrl = this.formControl();

    ctrl.setValue(value);

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
