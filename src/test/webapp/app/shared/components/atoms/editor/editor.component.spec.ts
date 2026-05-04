import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { extractTextFromHtml } from 'app/shared/util/text.util';
import { provideHttpClientMock } from 'util/http-client.mock';
import { BiasedIssues } from 'app/generated/model/biased-issues';
import { ContentChange } from 'ngx-quill';

function makeEditorEvent(html: string, overrides: Partial<unknown> = {}): ContentChange {
  const plainText = extractTextFromHtml(html);
  return {
    source: 'user',
    content: { ops: [] },
    delta: { ops: [] },
    oldDelta: { ops: [] },
    html: html,
    text: plainText,
    editor: {
      root: { innerHTML: html },
      getSelection: () => ({ index: 0, length: 0 }),
      setContents: vi.fn(),
      setSelection: vi.fn(),
      getText: () => plainText,
      getLength: () => plainText.length,
      ...overrides,
    },
  } as unknown as ContentChange;
}

describe('EditorComponent', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('label', 'Description');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('characterLimit', 100);
    fixture.componentRef.setInput('helperText', 'editor.helper.text');
    fixture.detectChanges();
    return fixture;
  }

  function setBiasedAnalysis(fixture: ComponentFixture<EditorComponent>, biasedAnalysis: BiasedIssues[] | undefined): void {
    fixture.componentRef.setInput('biasedAnalysis', biasedAnalysis);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent, ReactiveFormsModule],
      providers: [provideFontAwesomeTesting(), provideTranslateMock(), provideHttpClientMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should compute character count correctly from htmlValue', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const text = '<p>Hello World</p>';
      const extracted = extractTextFromHtml(text);
      expect(extracted).toBe('Hello World');

      const htmlSignal = (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue;
      htmlSignal.set('<p>ABC</p>');
      htmlSignal.set('<p>ABC</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.characterCount()).toBe(3);
    });

    it('should detect over character limit correctly', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const htmlSignal = (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue;
      htmlSignal.set('<p>' + 'x'.repeat(500) + '</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.isOverCharLimit()).toBe(true);
      expect(comp.charCounterColor()).toBe('char-counter-danger');
    });

    it('should compute warning color when near limit', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const htmlSignal = (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue;
      htmlSignal.set('<p>' + 'x'.repeat(120) + '</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.charCounterColor()).toBe('char-counter-warning');
    });

    it('should return normal counter color when within limit', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const htmlSignal = (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue;
      htmlSignal.set('<p>short text</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.charCounterColor()).toBe('char-counter-normal');
    });
  });

  describe('Error handling', () => {
    it('should set error message for empty required input', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      vi.spyOn(comp, 'isTouched').mockReturnValue(true);
      vi.spyOn(comp, 'isFocused').mockReturnValue(false);
      (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('');
      fixture.detectChanges();

      const error = comp.errorMessage();
      expect(error).toBeDefined();
    });

    it('should set error message when over character limit', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('<p>' + 'x'.repeat(500) + '</p>');
      fixture.detectChanges();

      const msg = comp.errorMessage();
      expect(msg).toBeDefined();
    });

    it('should return required error when input is empty and required is true', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('required', true);

      (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('');

      vi.spyOn(comp, 'isFocused').mockReturnValue(false);
      vi.spyOn(comp, 'isTouched').mockReturnValue(true);

      const translateSpy = vi.spyOn(comp['translate'], 'instant').mockReturnValue('required-message');

      const msg = comp.errorMessage();

      expect(msg).toBe('required-message');
      expect(translateSpy).toHaveBeenCalledWith('global.input.error.required');
    });
  });

  describe('Form control integration', () => {
    it('should patch form control when formControl exists', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('');
      vi.spyOn(comp, 'formControl').mockReturnValue(ctrl);
      vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(true);

      const event = makeEditorEvent('<p>Updated</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);
      expect(ctrl.value).toBe('<p>Updated</p>');
      expect(ctrl.dirty).toBe(true);
    });

    it('editorValue returns empty string when formControl value is null (value ?? "")', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      const ctrl = new FormControl(null);
      vi.spyOn(comp, 'formControl').mockReturnValue(ctrl);

      expect(comp.editorValue()).toBe('');
    });

    it('should return model() when no formControl is present (else branch)', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(false);
      vi.spyOn(comp, 'model').mockReturnValue('<p>Model content</p>');

      const result = comp.editorValue();

      expect(result).toBe('<p>Model content</p>');
    });

    it('should emit modelChange when formControl is not present (else branch)', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(false);
      const emitSpy = vi.spyOn(comp.modelChange, 'emit');

      const event = makeEditorEvent('<p>Standalone test</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

      expect(emitSpy).toHaveBeenCalledWith('<p>Standalone test</p>');
    });
  });

  describe('Text change handling', () => {
    it('should not react when source is not user', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.modelChange, 'emit');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged({
        source: 'api',
        oldDelta: {},
        editor: { root: { innerHTML: '<p>Ignored</p>' } },
      });

      expect(emitSpy).not.toHaveBeenCalledOnce();
    });

    it('should truncate changes if text exceeds max buffer', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const event = makeEditorEvent('<p>' + 'x'.repeat(1000) + '</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

      expect(event.editor.setContents).toHaveBeenCalledOnce();
      expect(event.editor.setSelection).toHaveBeenCalledOnce();
    });

    it('textChanged applies default (characterLimit ?? STANDARD_CHARACTER_LIMIT) + buffer', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      const event = makeEditorEvent('<p>' + 'x'.repeat(900) + '</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

      expect(event.editor.setContents).toHaveBeenCalledOnce();
      expect(event.editor.setSelection).toHaveBeenCalledOnce();
    });
  });

  describe('Focus and blur', () => {
    it('should handle focus and blur correctly', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const spyFocus = vi.spyOn(comp, 'onFocus');
      const spyBlur = vi.spyOn(comp, 'onBlur');

      comp.onFocus();
      comp.onBlur();

      expect(spyFocus).toHaveBeenCalledTimes(1);
      expect(spyBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Character limit edge cases', () => {
    it('should return normal color and not match limit when characterLimit is explicitly undefined', async () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('characterLimit', undefined);
      fixture.detectChanges();
      await fixture.whenStable();

      (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('<p>' + 'x'.repeat(560) + '</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.isOverCharLimit()).toBe(false);
      expect(comp.charCounterColor()).toBe('char-counter-normal');
    });

    it('should not truncate text when characterLimit is undefined', async () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('characterLimit', undefined);
      fixture.detectChanges();
      await fixture.whenStable();

      const event = makeEditorEvent('<p>' + 'x'.repeat(560) + '</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

      expect(event.editor.setContents).not.toHaveBeenCalled();
      expect(event.editor.setSelection).not.toHaveBeenCalled();
    });
  });

  describe('Gender Decoder Integration', () => {
    it('should not show gender decoder button when showGenderDecoderButton is false', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', false);
      fixture.detectChanges();

      expect(comp.shouldShowButton()).toBe(false);
    });

    it('should show gender decoder button when showGenderDecoderButton is true and biasedAnalysis exists', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', true);
      setBiasedAnalysis(fixture, [{ coding: 'non-inclusive-coded' }]);

      expect(comp.shouldShowButton()).toBe(true);
    });

    it('should not show button when showGenderDecoderButton is true but biasedAnalysis is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', true);
      setBiasedAnalysis(fixture, undefined);

      expect(comp.shouldShowButton()).toBe(false);
    });
  });

  describe('codingDisplay computed', () => {
    it('should return null when biasedAnalysis is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, undefined);

      expect(comp.codingDisplay()).toBeNull();
    });

    it('should return null when biasedAnalysis.coding is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{}]);

      expect(comp.codingDisplay()).toBeNull();
    });

    it('should return translated text for non-inclusive-coded', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'non-inclusive-coded' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.nonInclusive');
    });

    it('should return translated text for inclusive-coded', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'inclusive-coded' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.inclusive');
    });

    it('should return translated text for neutral', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'neutral' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return translated text for empty', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'empty' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should update when language changes', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'non-inclusive-coded' }]);

      const result1 = comp.codingDisplay();
      expect(result1).toBe('genderDecoder.formulationTexts.nonInclusive');

      comp['translate'].use('de');
      await fixture.whenStable();
      fixture.detectChanges();

      const result2 = comp.codingDisplay();
      expect(result2).toBe('genderDecoder.formulationTexts.nonInclusive');
    });
  });

  describe('shouldShowButton computed', () => {
    it('should return false when showGenderDecoderButton is false', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', false);
      setBiasedAnalysis(fixture, [{ coding: 'neutral' }]);

      expect(comp.shouldShowButton()).toBe(false);
    });

    it('should return false when biasedAnalysis is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', true);
      setBiasedAnalysis(fixture, undefined);

      expect(comp.shouldShowButton()).toBe(false);
    });

    it('should return true when showGenderDecoderButton is true and biasedAnalysis exists', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      fixture.componentRef.setInput('showGenderDecoderButton', true);
      setBiasedAnalysis(fixture, [{ coding: 'neutral' }]);

      expect(comp.shouldShowButton()).toBe(true);
    });
  });

  describe('onGenderDecoderClick', () => {
    it('should set showAnalysisModal to true when biasedAnalysis exists', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ coding: 'non-inclusive-coded' }]);

      comp.onGenderDecoderClick();

      expect(comp.showAnalysisModal()).toBe(true);
    });

    it('should not set showAnalysisModal when biasedAnalysis is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, undefined);
      comp.showAnalysisModal.set(false);
      comp.onGenderDecoderClick();

      expect(comp.showAnalysisModal()).toBe(false);
    });
  });

  describe('closeAnalysisModal', () => {
    it('should set showAnalysisModal to false', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      comp.showAnalysisModal.set(true);
      comp.closeAnalysisModal();

      expect(comp.showAnalysisModal()).toBe(false);
    });
  });

  describe('getCodingTranslationKey', () => {
    it('should return correct key for "non-inclusive-coded"', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const result = comp['getCodingTranslationKey']('non-inclusive-coded');
      expect(result).toBe('genderDecoder.formulationTexts.nonInclusive');
    });

    it('should return correct key for "inclusive-coded"', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const result = comp['getCodingTranslationKey']('inclusive-coded');
      expect(result).toBe('genderDecoder.formulationTexts.inclusive');
    });

    it('should return correct key for "neutral"', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const result = comp['getCodingTranslationKey']('neutral');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return correct key for "empty"', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const result = comp['getCodingTranslationKey']('empty');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return default key for unknown coding', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const result = comp['getCodingTranslationKey']('unknown-type');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });
  });

  describe('Clipboard Text Styling', () => {
    it.each([
      {
        name: 'filter attributes to the allowed list',
        input: {
          ops: [
            { insert: 'x', attributes: { bold: true, italic: false, color: 'red', unknown: 1, align: 'center', background: '#fff' } },
            { insert: 'Click Me', attributes: { link: 'https://vitest.dev', header: 1, bad: 'style' } },
          ],
        },
        expected: [
          { insert: 'x', attributes: { bold: true, italic: false, align: 'center' } },
          { insert: 'Click Me', attributes: { link: 'https://vitest.dev', header: 1 } },
        ],
      },
      {
        name: 'remove attributes when none are allowed',
        input: { ops: [{ insert: 'x', attributes: { color: 'red', style: 'foo' } }] },
        expected: [{ insert: 'x', attributes: undefined }],
      },
      {
        name: 'return the same if no attributes present',
        input: { ops: [{ insert: 'plain text' }] },
        expected: [{ insert: 'plain text' }],
      },
    ])('should $name', ({ input, expected }) => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const matcherFn = comp.quillModules.clipboard.matchers[0][1];
      if (typeof matcherFn !== 'function') {
        throw new Error('Expected clipboard matcher to be a function');
      }
      const result = matcherFn(document.createElement('div'), input);

      expect(result.ops).toEqual(expected);
    });
  });
});
