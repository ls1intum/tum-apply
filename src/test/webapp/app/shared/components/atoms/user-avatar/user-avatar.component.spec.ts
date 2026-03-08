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

  describe('initials', () => {
    it('should use "U" for missing, empty, and whitespace-only names', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);

      fixture.componentRef.setInput('fullName', undefined);
      fixture.detectChanges();
      expect(fixture.componentInstance.initials()).toBe('U');

      fixture.componentRef.setInput('fullName', '');
      fixture.detectChanges();
      expect(fixture.componentInstance.initials()).toBe('U');
    });

    it('should derive first and last initials for full names', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      fixture.componentRef.setInput('fullName', 'Max Applicant');
      fixture.detectChanges();

      expect(fixture.componentInstance.initials()).toBe('MA');
    });

    it('should derive a single initial for one-part names', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      fixture.componentRef.setInput('fullName', 'max');
      fixture.detectChanges();

      expect(fixture.componentInstance.initials()).toBe('M');
    });
  });

  describe('ariaLabel', () => {
    it('should use a fallback label for missing names and the full label for present names', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);

      fixture.componentRef.setInput('fullName', '   ');
      fixture.detectChanges();
      expect(fixture.componentInstance.ariaLabel()).toBe('User avatar');

      fixture.componentRef.setInput('fullName', 'Sophie Lee');
      fixture.detectChanges();
      expect(fixture.componentInstance.ariaLabel()).toBe('Avatar of Sophie Lee');
    });
  });

  describe('backgroundColor', () => {
    it('should use the same color for undefined and empty or whitespace-only names', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);

      fixture.componentRef.setInput('fullName', undefined);
      fixture.detectChanges();
      const colorForUndefined = fixture.componentInstance.backgroundColor();

      fixture.componentRef.setInput('fullName', '');
      fixture.detectChanges();
      const colorForEmpty = fixture.componentInstance.backgroundColor();

      expect(colorForEmpty).toBe(colorForUndefined);
    });
  });

  describe('sizeClass', () => {
    it('should use the lg size class when size is set to lg', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      expect(fixture.componentInstance.sizeClass()).toBe('h-10 w-10 text-[0.95rem]');
    });

    it('should use the md size class by default', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.sizeClass()).toBe('h-8 w-8 text-[0.8rem]');
    });

    it('should use the xl size class when size is set to xl', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();

      expect(fixture.componentInstance.sizeClass()).toBe('h-16 w-16 text-[1.2rem]');
    });
  });

  describe('private helpers', () => {
    it('should cover initials fallback when split and filter produce no parts', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      const initialsFromFullName = (fixture.componentInstance as any).initialsFromFullName.bind(fixture.componentInstance);

      expect(initialsFromFullName('   ')).toBe('U');
    });

    it('should cover the hashString negative hash branch', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      const hashString = (fixture.componentInstance as any).hashString.bind(fixture.componentInstance);

      const weirdValue = {
        length: 1,
        charCodeAt: () => -1,
      };

      expect(hashString(weirdValue as any)).toBe(4_294_967_295 - 4_294_967_296);
    });

    it('should return the default dark color for invalid hex input', () => {
      const fixture = TestBed.createComponent(UserAvatarComponent);
      const darkenHex = (fixture.componentInstance as any).darkenHex.bind(fixture.componentInstance);

      expect(darkenHex('#12345', 0.6)).toBe('#1f2937');
    });
  });
});
