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
});
