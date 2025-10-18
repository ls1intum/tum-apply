import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { faUser } from '@fortawesome/free-solid-svg-icons';

describe('TagComponent', () => {
  let fixture: ComponentFixture<TagComponent>;
  let component: TagComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------- DEFAULTS ----------------
  it('should create with default inputs', () => {
    expect(component).toBeTruthy();
    expect(component.text()).toBe('');
    expect(component.color()).toBe('primary');
    expect(component.icon()).toBeUndefined();
    expect(component.round()).toBe(false);
    expect(component.iconRight()).toBe(false);
    expect(component.tooltipText()).toBeUndefined();
    expect(component.width()).toBeUndefined();
    expect(component.widthValue()).toBeUndefined();
  });

  // ---------------- ICON PROP ----------------
  it('should return icon when provided', () => {
    fixture.componentRef.setInput('icon', faUser);
    fixture.detectChanges();
    expect(component.icon()).toBe(faUser);
    expect(component.iconProp()).toBe(faUser);
  });

  // ---------------- WIDTH VALUE ----------------
  it('should return undefined widthValue when width not set', () => {
    fixture.componentRef.setInput('width', undefined);
    fixture.detectChanges();
    expect(component.width()).toBeUndefined();
    expect(component.widthValue()).toBeUndefined();
  });

  it('should return widthValue when width is set', () => {
    fixture.componentRef.setInput('width', '150px');
    fixture.detectChanges();
    expect(component.width()).toBe('150px');
    expect(component.widthValue()).toBe('150px');
  });

  // ---------------- OTHER INPUTS ----------------
  it('should accept round, iconRight, tooltipText, color and text', () => {
    fixture.componentRef.setInput('text', 'Hello');
    fixture.componentRef.setInput('color', 'success');
    fixture.componentRef.setInput('round', true);
    fixture.componentRef.setInput('iconRight', true);
    fixture.componentRef.setInput('tooltipText', 'Tooltip!');
    fixture.detectChanges();

    expect(component.text()).toBe('Hello');
    expect(component.color()).toBe('success');
    expect(component.round()).toBe(true);
    expect(component.iconRight()).toBe(true);
    expect(component.tooltipText()).toBe('Tooltip!');
  });
});
