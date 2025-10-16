import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomSanitizer } from '@angular/platform-browser';
import { Prose } from 'app/evaluation/components/prose/prose';

enum MockSecurityContext {
  HTML = 1,
}

describe('Prose', () => {
  let fixture: ComponentFixture<Prose>;
  let comp: Prose;
  let mockSanitizer: { sanitize: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockSanitizer = { sanitize: vi.fn((ctx: MockSecurityContext, val: string) => val) };

    await TestBed.configureTestingModule({
      imports: [Prose],
      providers: [{ provide: DomSanitizer, useValue: mockSanitizer }],
    })
      .overrideComponent(Prose, { set: { template: '' } }) // don’t render HTML
      .compileComponents();

    fixture = TestBed.createComponent(Prose);
    comp = fixture.componentInstance;
  });

  it('returns "—" when text is undefined', () => {
    fixture.componentRef.setInput('text', undefined);
    fixture.detectChanges();

    expect(comp.safeHtml()).toBe('—');
  });

  it('returns sanitized text when sanitizer provides value', () => {
    mockSanitizer.sanitize.mockReturnValue('<b>ok</b>');

    fixture.componentRef.setInput('text', '<b>ok</b>');
    fixture.detectChanges();

    expect(comp.safeHtml()).toBe('<b>ok</b>');
    expect(mockSanitizer.sanitize).toHaveBeenCalledWith(MockSecurityContext.HTML, '<b>ok</b>');
  });

  it('returns "—" if sanitizer returns null', () => {
    mockSanitizer.sanitize.mockReturnValue(null);

    fixture.componentRef.setInput('text', '<script>alert(1)</script>');
    fixture.detectChanges();

    expect(comp.safeHtml()).toBe('—');
  });
});
