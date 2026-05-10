import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { provideRouter } from '@angular/router';

import FooterComponent from 'app/layouts/footer/footer.component';
import { ProfileService } from 'app/layouts/profiles/profile.service';
import { GitInfo, ProfileInfo } from 'app/layouts/profiles/profile-info.model';
import { provideTranslateMock } from 'util/translate.mock';

const gitInfo: GitInfo = {
  branch: 'main',
  commitHashShort: 'bffa799',
  commitHashFull: 'bffa79953d4a8ae56405d9ba58d04eed1c351574',
  commitTime: '2026-05-10T16:24:58+0200',
  lastCommitter: 'Catherine Kalra',
};

function buildComponent(profileInfo: Partial<ProfileInfo>): ComponentFixture<FooterComponent> {
  const profileServiceMock = {
    getProfileInfo: vi.fn().mockReturnValue(of({ activeProfiles: [], ...profileInfo })),
  };
  TestBed.configureTestingModule({
    imports: [FooterComponent],
    providers: [provideRouter([]), provideTranslateMock(), { provide: ProfileService, useValue: profileServiceMock }],
  });
  const fixture = TestBed.createComponent(FooterComponent);
  fixture.detectChanges();
  return fixture;
}

describe('FooterComponent', () => {
  it('should render the git info row when ribbonEnv and gitInfo are both present', () => {
    const fixture = buildComponent({ ribbonEnv: 'dev', gitInfo });
    const row = fixture.nativeElement.querySelector('[data-testid="footer-git-info"]');
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('main');
    expect(row.textContent).toContain('bffa799');
    expect(row.textContent).toContain('Catherine Kalra');
  });

  it('should hide the git info row when ribbonEnv is missing', () => {
    const fixture = buildComponent({ gitInfo });
    expect(fixture.nativeElement.querySelector('[data-testid="footer-git-info"]')).toBeNull();
  });

  it('should hide the git info row when gitInfo is missing', () => {
    const fixture = buildComponent({ ribbonEnv: 'dev' });
    expect(fixture.nativeElement.querySelector('[data-testid="footer-git-info"]')).toBeNull();
  });

  it('should link the commit hash to the full sha on GitHub', () => {
    const fixture = buildComponent({ ribbonEnv: 'dev', gitInfo });
    const link = fixture.nativeElement.querySelector('[data-testid="footer-git-info"] a');
    expect(link.getAttribute('href')).toBe('https://github.com/ls1intum/tum-apply/commit/bffa79953d4a8ae56405d9ba58d04eed1c351574');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
