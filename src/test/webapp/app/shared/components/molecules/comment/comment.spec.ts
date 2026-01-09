import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Comment } from 'app/shared/components/molecules/comment/comment';
import { provideTranslateMock } from '../../../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';

describe('Comment', () => {
  let fixture: ComponentFixture<Comment>;
  let component: Comment;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comment],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Comment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------- CAN SAVE ----------------
  it('canSave true in create mode when draft has text', () => {
    fixture.componentRef.setInput('isCreate', true);
    fixture.detectChanges();

    const event = { target: { value: 'hi' } } as unknown as InputEvent;
    component.onInput(event);
    expect(component['canSave']()).toBe(true);
  });

  it('canSave false when not edit and not create', () => {
    fixture.componentRef.setInput('isCreate', false);
    component['draft'].set('something');
    component.text.set('something');
    fixture.detectChanges();

    expect(component['canSave']()).toBe(false);
  });

  it('canSave true in edit mode when draft differs from text', () => {
    fixture.componentRef.setInput('commentId', '1');
    fixture.componentRef.setInput('editingId', '1');
    component.text.set('old');
    component['draft'].set('new');
    fixture.detectChanges();

    expect(component['isEdit']()).toBe(true);
    expect(component['canSave']()).toBe(true);
  });

  // ---------------- UPDATE DRAFT EFFECT ----------------
  it('updates draft when creating', () => {
    fixture.componentRef.setInput('isCreate', true);
    component.text.set('draftText');
    fixture.detectChanges();

    expect(component['draft']()).toBe('draftText');
  });

  it('updates draft when not editing', () => {
    fixture.componentRef.setInput('isCreate', false);
    fixture.componentRef.setInput('editingId', 'x');
    fixture.componentRef.setInput('commentId', 'y');
    component.text.set('abc');
    fixture.detectChanges();

    expect(component['isEdit']()).toBe(false);
    expect(component['draft']()).toBe('abc');
  });

  // ---------------- ONINPUT ----------------
  it('onInput updates draft and text in create mode', () => {
    fixture.componentRef.setInput('isCreate', true);
    fixture.detectChanges();

    const event = { target: { value: 'hello' } } as unknown as InputEvent;
    component.onInput(event);

    expect(component['draft']()).toBe('hello');
    expect(component.text()).toBe('hello');
  });

  it('onInput updates draft only when not create', () => {
    fixture.componentRef.setInput('isCreate', false);
    fixture.detectChanges();

    const event = { target: { value: 'world' } } as unknown as InputEvent;
    component.onInput(event);

    expect(component['draft']()).toBe('world');
    expect(component.text()).toBe('');
  });

  // ---------------- START / CANCEL / SAVE ----------------
  it('startEdit copies text to draft and emits enterEdit', () => {
    const spy = vi.fn();
    component.text.set('copyMe');
    component.enterEdit.subscribe(spy);

    component.startEdit();

    expect(component['draft']()).toBe('copyMe');
    expect(spy).toHaveBeenCalled();
  });

  it('onCancel emits exitEdit', () => {
    const spy = vi.fn();
    component.exitEdit.subscribe(spy);

    component.onCancel();

    expect(spy).toHaveBeenCalled();
  });

  it('onSave emits saved and exitEdit', () => {
    const savedSpy = vi.fn();
    const exitSpy = vi.fn();
    component.saved.subscribe(savedSpy);
    component.exitEdit.subscribe(exitSpy);

    component['draft'].set('final');
    component.onSave();

    expect(savedSpy).toHaveBeenCalledWith('final');
    expect(exitSpy).toHaveBeenCalled();
  });
});
