import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeService } from 'app/service/theme.service';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';

describe('UserAvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatarComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal<'light' | 'dark' | 'blossom' | 'aquabloom'>('light'),
          },
        },
      ],
    }).compileComponents();
  });

  it('uses "U" as initials for missing, empty, and whitespace-only names', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);

    fixture.componentRef.setInput('fullName', undefined);
    fixture.detectChanges();
    expect(fixture.componentInstance.initials()).toBe('U');

    fixture.componentRef.setInput('fullName', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.initials()).toBe('U');
  });

  it('derives first and last initials for full names', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.componentRef.setInput('fullName', 'Max Applicant');
    fixture.detectChanges();

    expect(fixture.componentInstance.initials()).toBe('MA');
  });

  it('derives a single initial for one-part names', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.componentRef.setInput('fullName', 'max');
    fixture.detectChanges();

    expect(fixture.componentInstance.initials()).toBe('M');
  });

  it('uses fallback aria label for missing names and full label for present names', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);

    fixture.componentRef.setInput('fullName', '   ');
    fixture.detectChanges();
    expect(fixture.componentInstance.ariaLabel()).toBe('User avatar');

    fixture.componentRef.setInput('fullName', 'Sophie Lee');
    fixture.detectChanges();
    expect(fixture.componentInstance.ariaLabel()).toBe('Avatar of Sophie Lee');
  });

  it('uses the same background color for undefined and empty/whitespace names', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);

    fixture.componentRef.setInput('fullName', undefined);
    fixture.detectChanges();
    const colorForUndefined = fixture.componentInstance.backgroundColor();

    fixture.componentRef.setInput('fullName', '');
    fixture.detectChanges();
    const colorForEmpty = fixture.componentInstance.backgroundColor();

    expect(colorForEmpty).toBe(colorForUndefined);
  });

  it('uses lg size class when size is set to lg', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    expect(fixture.componentInstance.sizeClass()).toBe('h-11 w-11 text-[1.10rem]');
  });

  it('uses md size class by default', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.sizeClass()).toBe('h-9 w-9 text-[0.95rem]');
  });

  it('uses xl size class when size is set to xl', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.componentRef.setInput('size', 'xl');
    fixture.detectChanges();

    expect(fixture.componentInstance.sizeClass()).toBe('h-16 w-16 text-[1.2rem]');
  });

  it('covers initials fallback when split/filter produces no parts', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    const initialsFromFullName = (fixture.componentInstance as any).initialsFromFullName.bind(fixture.componentInstance);

    expect(initialsFromFullName('   ')).toBe('U');
  });

  it('covers hashString negative hash branch', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    const hashString = (fixture.componentInstance as any).hashString.bind(fixture.componentInstance);

    const weirdValue = {
      length: 1,
      charCodeAt: () => -1,
    };

    expect(hashString(weirdValue as any)).toBe(4_294_967_295 - 4_294_967_296);
  });

  it('returns default dark color for invalid hex input', () => {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    const darkenHex = (fixture.componentInstance as any).darkenHex.bind(fixture.componentInstance);

    expect(darkenHex('#12345', 0.6)).toBe('#1f2937');
  });
});
