import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';

import { ProfileService } from 'app/layouts/profiles/profile.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { ProfileInfo } from 'app/layouts/profiles/profile-info.model';
import { createHttpClientMock, provideHttpClientMock, HttpClientMock } from 'util/http-client.mock';

describe('ProfileService', () => {
  let httpMock: HttpClientMock;

  const buildInfoResponse = (overrides: Record<string, unknown> = {}) =>
    Object.assign(
      {
        activeProfiles: ['dev'],
        'display-ribbon-on-profiles': 'dev,test',
        git: {
          branch: 'main',
          commit: {
            id: {
              full: 'abc1234def5678ghi9012jkl3456mno7890pqrst',
              abbrev: 'abc1234',
            },
            time: '2026-05-10T16:24:58+0200',
            user: { name: 'Test Committer' },
          },
        },
      },
      overrides,
    );

  beforeEach(() => {
    httpMock = createHttpClientMock();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClientMock(httpMock),
        { provide: ApplicationConfigService, useValue: { getEndpointFor: (p: string) => `/${p}` } },
      ],
    });
  });

  it('should map git fields from /management/info response into ProfileInfo.gitInfo', async () => {
    httpMock.get.mockReturnValueOnce(of(buildInfoResponse()));
    const service = TestBed.inject(ProfileService);

    const profileInfo = await new Promise<ProfileInfo>(resolve => service.getProfileInfo().subscribe(resolve));

    expect(profileInfo.gitInfo).toEqual({
      branch: 'main',
      commitHashShort: 'abc1234',
      commitHashFull: 'abc1234def5678ghi9012jkl3456mno7890pqrst',
      commitTime: '2026-05-10T16:24:58+0200',
      lastCommitter: 'Test Committer',
    });
  });

  it('should leave gitInfo undefined when /management/info response has no git block', async () => {
    httpMock.get.mockReturnValueOnce(of(buildInfoResponse({ git: undefined })));
    const service = TestBed.inject(ProfileService);

    const profileInfo = await new Promise<ProfileInfo>(resolve => service.getProfileInfo().subscribe(resolve));

    expect(profileInfo.gitInfo).toBeUndefined();
  });

  it('should also handle the simple git mode where commit.id is a plain string', async () => {
    httpMock.get.mockReturnValueOnce(
      of(
        buildInfoResponse({
          git: {
            branch: 'main',
            commit: {
              id: 'abc1234def5678ghi9012jkl3456mno7890pqrst',
              time: '2026-05-10T16:24:58+0200',
              user: { name: 'Test Committer' },
            },
          },
        }),
      ),
    );
    const service = TestBed.inject(ProfileService);

    const profileInfo = await new Promise<ProfileInfo>(resolve => service.getProfileInfo().subscribe(resolve));

    expect(profileInfo.gitInfo).toEqual({
      branch: 'main',
      commitHashShort: 'abc1234',
      commitHashFull: 'abc1234def5678ghi9012jkl3456mno7890pqrst',
      commitTime: '2026-05-10T16:24:58+0200',
      lastCommitter: 'Test Committer',
    });
  });
});
