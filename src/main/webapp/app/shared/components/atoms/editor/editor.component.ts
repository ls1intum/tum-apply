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

  private htmlValue = signal('');

  onInputChange(event: EditorTextChangeEvent): void {
    const value = event.htmlValue;
    this.htmlValue.set(value); // update HTML signal

    this.modelChange.emit(value);
    const ctrl = this.formControl();

    ctrl.setValue(value);

    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  // Extract plain text from HTML
  private extractTextFromHtml(htmlText: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    return (temp.textContent ?? temp.innerText) || '';
  }
}
