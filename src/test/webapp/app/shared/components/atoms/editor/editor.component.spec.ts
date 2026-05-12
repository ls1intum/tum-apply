import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { extractTextFromHtml } from 'app/shared/util/text.util';
import { provideHttpClientMock } from 'util/http-client.mock';
import { BiasedIssue } from 'app/generated/model/biased-issue';
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
    editor: Object.assign(
      {
        root: { innerHTML: html },
        getSelection: () => ({ index: 0, length: 0 }),
        setContents: vi.fn(),
        setSelection: vi.fn(),
        getText: () => plainText,
        getLength: () => plainText.length,
      },
      overrides,
    ),
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

  function setBiasedAnalysis(fixture: ComponentFixture<EditorComponent>, biasedAnalysis: BiasedIssue[] | undefined): void {
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
    it.each([
      ['<p>ABC</p>', 3, '', false],
      ['<p>' + 'x'.repeat(500) + '</p>', 500, 'text-negative', true],
      ['<p>' + 'x'.repeat(120) + '</p>', 120, 'text-warning', false],
      ['<p>short text</p>', 'short text'.length, '', false],
    ])('should compute character count, color and over-limit state for %s', async (html, count, color, over) => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const htmlSignal = (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue;
      htmlSignal.set(html);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.characterCount()).toBe(count);
      expect(comp.charCounterColor()).toBe(color);
      expect(comp.isOverCharLimit()).toBe(over);
    });
  });

  describe('Error handling', () => {
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
    it('should patch form control when formControl exists', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('');
      vi.spyOn(comp, 'formControl').mockReturnValue(ctrl);
      vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(true);

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(makeEditorEvent('<p>Updated</p>'));
      expect(ctrl.value).toBe('<p>Updated</p>');
      expect(ctrl.dirty).toBe(true);
    });

    it('should return empty string from editorValue when formControl value is null', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;
      vi.spyOn(comp, 'formControl').mockReturnValue(new FormControl(null));

      expect(comp.editorValue()).toBe('');
    });

    it('should fall back to model() and emit modelChange when no formControl is present', () => {
      const fixture = TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;

      vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(false);
      vi.spyOn(comp, 'model').mockReturnValue('<p>Model content</p>');
      const emitSpy = vi.spyOn(comp.modelChange, 'emit');

      expect(comp.editorValue()).toBe('<p>Model content</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(makeEditorEvent('<p>Standalone test</p>'));
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

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['custom characterLimit', 'createFixture' as const, 1000],
      ['default characterLimit', 'default' as const, 900],
    ])('should truncate when text exceeds buffer (%s)', (_desc, fixtureType, charCount) => {
      const fixture = fixtureType === 'createFixture' ? createFixture() : TestBed.createComponent(EditorComponent);
      const comp = fixture.componentInstance;
      const event = makeEditorEvent('<p>' + 'x'.repeat(charCount) + '</p>');

      (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

      expect(event.editor.setContents).toHaveBeenCalledOnce();
      expect(event.editor.setSelection).toHaveBeenCalledOnce();
    });
  });

  describe('Character limit edge cases', () => {
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
      setBiasedAnalysis(fixture, [{ type: 'NON_INCLUSIVE' }]);

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

  describe('formulationDisplay computed', () => {
    it('should return null when biasedAnalysis is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, undefined);

      expect(comp.codingDisplay()).toBeUndefined();
    });

    it('should return neutral text when biasedAnalysis is empty', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, []);

      expect(comp.codingDisplay()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return translated text when non-inclusive issues outnumber inclusive issues', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ type: 'NON_INCLUSIVE' }, { type: 'NON_INCLUSIVE' }, { type: 'INCLUSIVE' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.nonInclusive');
    });

    it('should return translated text when inclusive issues outnumber non-inclusive issues', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ type: 'INCLUSIVE' }, { type: 'INCLUSIVE' }, { type: 'NON_INCLUSIVE' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.inclusive');
    });

    it('should return translated text for balanced issues', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ type: 'INCLUSIVE' }, { type: 'NON_INCLUSIVE' }]);

      const result = comp.codingDisplay();
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should update when language changes', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ type: 'NON_INCLUSIVE' }]);

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
      setBiasedAnalysis(fixture, [{ type: 'INCLUSIVE' }]);

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
      setBiasedAnalysis(fixture, [{ type: 'INCLUSIVE' }]);

      expect(comp.shouldShowButton()).toBe(true);
    });
  });

  describe('analysis modal handlers', () => {
    it('should toggle showAnalysisModal when biasedAnalysis exists and reset on close', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setBiasedAnalysis(fixture, [{ type: 'NON_INCLUSIVE' }]);

      comp.onGenderDecoderClick();
      expect(comp.showAnalysisModal()).toBe(true);

      comp.closeAnalysisModal();
      expect(comp.showAnalysisModal()).toBe(false);
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
