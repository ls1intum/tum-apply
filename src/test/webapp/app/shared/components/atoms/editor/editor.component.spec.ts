import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent, ReactiveFormsModule],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label, required mark, and helper text', async () => {
    const fixture = createFixture();
    fixture.detectChanges();
    await fixture.whenStable();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('Description');
    expect(label.textContent).toContain('*');

    const helper = fixture.debugElement.query(By.css('.helper-text')).nativeElement;
    expect(helper.textContent).toContain('editor.helper.text');
  });

  it('should compute character count correctly from htmlValue', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const text = '<p>Hello World</p>';
    const extracted = (comp as unknown as { extractTextFromHtml: (html: string) => string }).extractTextFromHtml(text);
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
    htmlSignal.set('<p>' + 'x'.repeat(200) + '</p>');
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

    (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('<p>' + 'x'.repeat(300) + '</p>');
    fixture.detectChanges();

    const msg = comp.errorMessage();
    expect(msg).toBeDefined();
  });

  it('should patch form control when formControl exists', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(ctrl);
    vi.spyOn(comp as unknown as { hasFormControl: () => boolean }, 'hasFormControl').mockReturnValue(true);

    const event = {
      source: 'user',
      oldDelta: {},
      editor: {
        root: { innerHTML: '<p>Updated</p>' },
        getSelection: () => null,
        setContents: vi.fn(),
        setSelection: vi.fn(),
      },
    };

    (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);
    expect(ctrl.value).toBe('<p>Updated</p>');
    expect(ctrl.dirty).toBe(true);
  });

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

  it('should truncate changes if text exceeds max buffer', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const setContents = vi.fn();
    const setSelection = vi.fn();

    const event = {
      source: 'user',
      oldDelta: { ops: [] },
      editor: {
        root: { innerHTML: '<p>' + 'x'.repeat(1000) + '</p>' },
        getSelection: () => ({ index: 0, length: 0 }),
        setContents,
        setSelection,
      },
    };

    (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);
    expect(setContents).toHaveBeenCalled();
    expect(setSelection).toHaveBeenCalled();
  });

  it('should handle focus and blur correctly', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const spyFocus = vi.spyOn(comp, 'onFocus');
    const spyBlur = vi.spyOn(comp, 'onBlur');

    const editor = fixture.debugElement.query(By.css('quill-editor'));
    editor.triggerEventHandler('onFocus', {});
    editor.triggerEventHandler('onBlur', {});

    expect(spyFocus).toHaveBeenCalled();
    expect(spyBlur).toHaveBeenCalled();
  });

  it('editorValue returns empty string when formControl value is null (value ?? "")', () => {
    const fixture = TestBed.createComponent(EditorComponent);
    const comp = fixture.componentInstance;

    const ctrl = new FormControl(null);
    vi.spyOn(comp, 'formControl').mockReturnValue(ctrl);

    expect(comp.editorValue()).toBe('');
  });

  it('textChanged applies default (characterLimit ?? STANDARD_CHARACTER_LIMIT) + buffer', () => {
    const fixture = TestBed.createComponent(EditorComponent);
    const comp = fixture.componentInstance;

    const setContents = vi.fn();
    const setSelection = vi.fn();

    const event = {
      source: 'user',
      oldDelta: { ops: [] },
      editor: {
        root: { innerHTML: '<p>' + 'x'.repeat(700) + '</p>' },
        getSelection: () => ({ index: 0, length: 0 }),
        setContents,
        setSelection,
      },
    };

    (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

    expect(setContents).toHaveBeenCalled();
    expect(setSelection).toHaveBeenCalled();
  });

  it('extractTextFromHtml falls back to final ?? "" when textContent is null and innerText.trim() returns undefined', () => {
    const fixture = TestBed.createComponent(EditorComponent);
    const comp = fixture.componentInstance;

    const mockElem = {
      innerHTML: '',
      textContent: null as unknown as string,
      innerText: { trim: (() => undefined) as unknown as () => string },
    };

    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockElem as HTMLElement);

    const result = (comp as unknown as { extractTextFromHtml: (html: string) => string }).extractTextFromHtml('<p>ignored</p>');
    expect(result).toBe('');

    createSpy.mockRestore();
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

    const event = {
      source: 'user',
      oldDelta: {},
      editor: {
        root: { innerHTML: '<p>Standalone test</p>' },
        getSelection: () => null,
        setContents: vi.fn(),
        setSelection: vi.fn(),
      },
    };

    (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

    expect(emitSpy).toHaveBeenCalledWith('<p>Standalone test</p>');
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

  it('uses STANDARD_CHARACTER_LIMIT in charCounterColor when characterLimit is explicitly undefined', async () => {
    const fixture = TestBed.createComponent(EditorComponent);
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('characterLimit', undefined);
    fixture.detectChanges();
    await fixture.whenStable();

    (comp as unknown as { htmlValue: { set: (v: string) => void } }).htmlValue.set('<p>' + 'x'.repeat(560) + '</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.isOverCharLimit()).toBe(true);
    expect(comp.charCounterColor()).toBe('char-counter-danger');
  });

  it('applies (characterLimit ?? STANDARD_CHARACTER_LIMIT) + buffer in textChanged when characterLimit is undefined', async () => {
    const fixture = TestBed.createComponent(EditorComponent);
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('characterLimit', undefined);
    fixture.detectChanges();
    await fixture.whenStable();

    const setContents = vi.fn();
    const setSelection = vi.fn();

    const event = {
      source: 'user',
      oldDelta: { ops: [] },
      editor: {
        root: { innerHTML: '<p>' + 'x'.repeat(560) + '</p>' },
        getSelection: () => ({ index: 0, length: 0 }),
        setContents,
        setSelection,
      },
    };

    (comp as unknown as { textChanged: (e: unknown) => void }).textChanged(event);

    expect(setContents).toHaveBeenCalledTimes(1);
    expect(setSelection).toHaveBeenCalledTimes(1);
  });
});
