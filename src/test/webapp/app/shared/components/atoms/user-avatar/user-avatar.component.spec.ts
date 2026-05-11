import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeService } from 'app/service/theme.service';
import { UserAvatarComponent } from 'app/shared/components/atoms/user-avatar/user-avatar.component';

describe('UserAvatarComponent', () => {
  let fixture: ComponentFixture<UserAvatarComponent>;
  type AvatarInputs = Partial<{
    fullName: string | undefined;
    avatarUrl: string | undefined;
    size: 'sm' | 'md' | 'lg' | 'xl';
    loading: 'eager' | 'lazy';
  }>;
  type UserAvatarComponentTestAccess = {
    initialsFromFullName: (name: string) => string;
    hashString: (value: string) => number;
    darkenHex: (hex: string, factor: number) => string;
  };

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

    fixture = TestBed.createComponent(UserAvatarComponent);
  });

  const render = (inputs: AvatarInputs = {}) => {
    if ('fullName' in inputs) {
      fixture.componentRef.setInput('fullName', inputs.fullName);
    }
    if ('avatarUrl' in inputs) {
      fixture.componentRef.setInput('avatarUrl', inputs.avatarUrl);
    }
    if ('size' in inputs) {
      fixture.componentRef.setInput('size', inputs.size);
    }
    if ('loading' in inputs) {
      fixture.componentRef.setInput('loading', inputs.loading);
    }

    fixture.detectChanges();
    return fixture.componentInstance;
  };

  const getImage = () => fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
  const component = () => fixture.componentInstance as unknown as UserAvatarComponentTestAccess;

  describe('initials', () => {
    it.each<[string | undefined, string]>([
      [undefined, 'U'],
      ['', 'U'],
      ['   ', 'U'],
      ['Max Applicant', 'MA'],
      ['max', 'M'],
    ])('should derive initials %s for fullName=%s', (fullName, expected) => {
      expect(render({ fullName }).initials()).toBe(expected);
    });
  });

  describe('ariaLabel', () => {
    it('should use a fallback label for missing names and the full label for present names', () => {
      expect(render({ fullName: '   ' }).ariaLabel()).toBe('User avatar');
      expect(render({ fullName: 'Sophie Lee' }).ariaLabel()).toBe('Avatar of Sophie Lee');
    });
  });

  describe('sizeClass', () => {
    it.each<[AvatarInputs['size'] | undefined, string]>([
      [undefined, 'h-10 w-10 text-[1rem]'],
      ['sm', 'h-10 w-10 text-[1rem]'],
      ['md', 'h-12 w-12 text-[1.2rem]'],
      ['lg', 'h-14 w-14 text-[1.4rem]'],
      ['xl', 'h-16 w-16 text-[1.6rem]'],
    ])('should use class %s for size %s', (size, expected) => {
      const inputs: AvatarInputs = size === undefined ? {} : { size };
      expect(render(inputs).sizeClass()).toBe(expected);
    });
  });

  describe('image loading', () => {
    it.each<['eager' | 'lazy']>([['eager'], ['lazy']])('should set loading=%s', loading => {
      render({ fullName: 'Max Applicant', avatarUrl: '/images/profiles/avatar.jpg', loading });

      expect(getImage()?.getAttribute('loading')).toBe(loading);
    });

    it('should default avatar images to eager loading', () => {
      render({ fullName: 'Max Applicant', avatarUrl: '/images/profiles/avatar.jpg' });

      expect(getImage()?.getAttribute('loading')).toBe('eager');
    });
  });

  describe('private helpers', () => {
    it('should cover the hashString negative hash branch', () => {
      const weirdValue = { length: 1, charCodeAt: () => -1 };

      expect(component().hashString(weirdValue as unknown as string)).toBe(4_294_967_295 - 4_294_967_296);
    });

    it('should return the default dark color for invalid hex input', () => {
      expect(component().darkenHex('#12345', 0.6)).toBe('#1f2937');
    });
  });
});
