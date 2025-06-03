import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  onInputChange(event: EditorTextChangeEvent): void {
    const value = event.htmlValue;
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
