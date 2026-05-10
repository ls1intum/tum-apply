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

  const buildInfoResponse = (overrides: Record<string, unknown> = {}) => ({
    activeProfiles: ['dev'],
    'display-ribbon-on-profiles': 'dev,test',
    git: {
      branch: 'main',
      commit: {
        id: 'bffa79953d4a8ae56405d9ba58d04eed1c351574',
        'id.abbrev': 'bffa799',
        time: '2026-05-10T16:24:58+0200',
        user: { name: 'Catherine Kalra' },
      },
    },
    ...overrides,
  });

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
      commitHashShort: 'bffa799',
      commitHashFull: 'bffa79953d4a8ae56405d9ba58d04eed1c351574',
      commitTime: '2026-05-10T16:24:58+0200',
      lastCommitter: 'Catherine Kalra',
    });
  });

  it('should leave gitInfo undefined when /management/info response has no git block', async () => {
    httpMock.get.mockReturnValueOnce(of(buildInfoResponse({ git: undefined })));
    const service = TestBed.inject(ProfileService);

    const profileInfo = await new Promise<ProfileInfo>(resolve => service.getProfileInfo().subscribe(resolve));

    expect(profileInfo.gitInfo).toBeUndefined();
  });
});
