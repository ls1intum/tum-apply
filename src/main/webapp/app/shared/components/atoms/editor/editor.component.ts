import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ContentChange, QuillEditorComponent } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { extractTextFromHtml } from 'app/shared/util/text.util';
import { GenderBiasAnalysisService } from 'app/service/gender-bias-analysis-service';
import { GenderBiasAnalysisResponse } from 'app/generated';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { BaseInputDirective } from '../base-input/base-input.component';

const STANDARD_CHARACTER_LIMIT = 500;
const STANDARD_CHARACTER_BUFFER = 50;

@Component({
  selector: 'jhi-editor',
  imports: [CommonModule, QuillEditorComponent, FontAwesomeModule, FormsModule, TranslateModule, TooltipModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent extends BaseInputDirective<string> {
  characterCount = computed(() => extractTextFromHtml(this.htmlValue()).length);
  fieldId = input<string>('default');
  characterLimit = input<number | undefined>(STANDARD_CHARACTER_LIMIT); // Optionally set maximum character limit
  helperText = input<string | undefined>(undefined); // Optional helper text to display below the editor field
  showGenderDecoderButton = input<boolean>(false);
  genderDecoderClick = output<string>();
  openAnalysisDialog = output<GenderBiasAnalysisResponse>();

  readonly genderBiasService = inject(GenderBiasAnalysisService);
  readonly translateService = inject(TranslateService);

  readonly analysisResult = signal<GenderBiasAnalysisResponse | null>(null);

  // Check if error message should be displayed
  isOverCharLimit = computed(() => {
    const count = this.characterCount();
    const limit = this.characterLimit() ?? STANDARD_CHARACTER_LIMIT;

    return count - limit >= STANDARD_CHARACTER_BUFFER;
  });
  isEmpty = computed(() => extractTextFromHtml(this.htmlValue()) === '' && !this.isFocused() && this.isTouched());

  errorMessage = computed(() => {
    this.langChange();

    if (this.isEmpty() && this.required()) {
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

  readonly codingDisplay = computed(() => {
    const result = this.analysisResult();
    if (!result?.coding) return null;

    const coding = result.coding;
    const key = this.getCodingTranslationKey(coding);
    return this.translateService.instant(key);
  });

  protected currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });

  private htmlValue = signal('');
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  private hasFormControl = computed(() => !!this.formControl());

  // Effect to sync htmlValue when editorValue changes (e.g., from form patching)
  private syncHtmlValueEffect = effect(() => {
    const currentEditorValue = this.editorValue();
    this.htmlValue.set(currentEditorValue);
  });

  private analyzeEffect = effect(() => {
    if (!this.showGenderDecoderButton()) return;

    const html = this.htmlValue();
    const lang = this.currentLang();
    const id = this.fieldId();

    this.genderBiasService.triggerAnalysis(id, html, lang);
  });

  private analysisSubscriptionEffect = effect(onCleanup => {
    const fieldId = this.fieldId();
    const subscription = this.genderBiasService.getAnalysisForField(fieldId).subscribe(result => this.analysisResult.set(result));

    onCleanup(() => subscription.unsubscribe());
  });

  textChanged(event: ContentChange): void {
    const { source, oldDelta, editor } = event;

    const maxChars = (this.characterLimit() ?? STANDARD_CHARACTER_LIMIT) + STANDARD_CHARACTER_BUFFER;

    if (source !== 'user') return;
    const newTextLength = extractTextFromHtml(editor.root.innerHTML).length;
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
    this.markAsTouchedManually();
  }

  onGenderDecoderClick(): void {
    const result = this.analysisResult();
    if (result) {
      this.openAnalysisDialog.emit(result);
    }
  }

  private getCodingTranslationKey(coding: string): string {
    const mapping: Record<string, string> = {
      'masculine-coded': 'genderDecoder.formulationTexts.manly',
      'feminine-coded': 'genderDecoder.formulationTexts.feminine',
      neutral: 'genderDecoder.formulationTexts.neutral',
      empty: 'genderDecoder.formulationTexts.neutral',
    };
    return mapping[coding] || mapping['neutral'];
  }
}

// TODO: implement placeholder text as HTML
