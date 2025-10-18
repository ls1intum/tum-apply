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

    component.onInput({ target: { value: 'hi' } } as any);
    expect((component as any).canSave()).toBe(true);
  });

  it('canSave false when not edit and not create', () => {
    fixture.componentRef.setInput('isCreate', false);
    (component as any).draft.set('something');
    component.text.set('something');
    fixture.detectChanges();

    expect((component as any).canSave()).toBe(false);
  });

  it('canSave true in edit mode when draft differs from text', () => {
    fixture.componentRef.setInput('commentId', '1');
    fixture.componentRef.setInput('editingId', '1');
    component.text.set('old');
    (component as any).draft.set('new');
    fixture.detectChanges();

    expect((component as any).isEdit()).toBe(true);
    expect((component as any).canSave()).toBe(true);
  });

  // ---------------- UPDATE DRAFT EFFECT ----------------
  it('updates draft when creating', () => {
    fixture.componentRef.setInput('isCreate', true);
    component.text.set('draftText');
    fixture.detectChanges();

    expect((component as any).draft()).toBe('draftText');
  });

  it('updates draft when not editing', () => {
    fixture.componentRef.setInput('isCreate', false);
    fixture.componentRef.setInput('editingId', 'x');
    fixture.componentRef.setInput('commentId', 'y');
    component.text.set('abc');
    fixture.detectChanges();

    expect((component as any).isEdit()).toBe(false);
    expect((component as any).draft()).toBe('abc');
  });

  // ---------------- ONINPUT ----------------
  it('onInput updates draft and text in create mode', () => {
    fixture.componentRef.setInput('isCreate', true);
    fixture.detectChanges();

    const event = { target: { value: 'hello' } } as any;
    component.onInput(event);

    expect((component as any).draft()).toBe('hello');
    expect(component.text()).toBe('hello');
  });

  it('onInput updates draft only when not create', () => {
    fixture.componentRef.setInput('isCreate', false);
    fixture.detectChanges();

    const event = { target: { value: 'world' } } as any;
    component.onInput(event);

    expect((component as any).draft()).toBe('world');
    expect(component.text()).toBe('');
  });

  // ---------------- START / CANCEL / SAVE ----------------
  it('startEdit copies text to draft and emits enterEdit', () => {
    const spy = vi.fn();
    component.text.set('copyMe');
    component.enterEdit.subscribe(spy);

    component.startEdit();

    expect((component as any).draft()).toBe('copyMe');
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

    (component as any).draft.set('final');
    component.onSave();

    expect(savedSpy).toHaveBeenCalledWith('final');
    expect(exitSpy).toHaveBeenCalled();
  });
});
