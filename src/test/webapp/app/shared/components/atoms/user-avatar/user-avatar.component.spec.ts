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
    it('should use "U" for missing, empty, and whitespace-only names', () => {
      for (const fullName of [undefined, '', '   ']) {
        expect(render({ fullName }).initials()).toBe('U');
      }
    });

    it('should derive first and last initials for full names', () => {
      expect(render({ fullName: 'Max Applicant' }).initials()).toBe('MA');
    });

    it('should derive a single initial for one-part names', () => {
      expect(render({ fullName: 'max' }).initials()).toBe('M');
    });
  });

  describe('ariaLabel', () => {
    it('should use a fallback label for missing names and the full label for present names', () => {
      expect(render({ fullName: '   ' }).ariaLabel()).toBe('User avatar');
      expect(render({ fullName: 'Sophie Lee' }).ariaLabel()).toBe('Avatar of Sophie Lee');
    });
  });

  describe('backgroundColor', () => {
    it('should use the same color for undefined and empty or whitespace-only names', () => {
      const colorForUndefined = render({ fullName: undefined }).backgroundColor();

      for (const fullName of ['', '   ']) {
        expect(render({ fullName }).backgroundColor()).toBe(colorForUndefined);
      }
    });
  });

  describe('sizeClass', () => {
    it('should use the lg size class when size is set to lg', () => {
      expect(render({ size: 'lg' }).sizeClass()).toBe('h-14 w-14 text-[1.4rem]');
    });

    it('should use the md size class by default', () => {
      expect(render().sizeClass()).toBe('h-10 w-10 text-[1rem]');
    });

    it('should use the xl size class when size is set to xl', () => {
      expect(render({ size: 'xl' }).sizeClass()).toBe('h-16 w-16 text-[1.6rem]');
    });
  });

  describe('image loading', () => {
    it('should default avatar images to eager loading', () => {
      render({ fullName: 'Max Applicant', avatarUrl: '/images/profiles/avatar.jpg' });

      expect(getImage()?.getAttribute('loading')).toBe('eager');
    });

    it('should allow lazy loading for list contexts', () => {
      render({ fullName: 'Max Applicant', avatarUrl: '/images/profiles/avatar.jpg', loading: 'lazy' });

      expect(getImage()?.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('private helpers', () => {
    it('should cover initials fallback when split and filter produce no parts', () => {
      expect(component().initialsFromFullName('   ')).toBe('U');
    });

    it('should cover the hashString negative hash branch', () => {
      const weirdValue = {
        length: 1,
        charCodeAt: () => -1,
      };

      expect(component().hashString(weirdValue as unknown as string)).toBe(4_294_967_295 - 4_294_967_296);
    });

    it('should return the default dark color for invalid hex input', () => {
      expect(component().darkenHex('#12345', 0.6)).toBe('#1f2937');
    });
  });
});
