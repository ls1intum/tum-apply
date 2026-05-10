import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

import { GitInfo, InfoGitResponse, InfoResponse, ProfileInfo } from './profile-info.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  private readonly infoUrl = this.applicationConfigService.getEndpointFor('management/info');
  private profileInfo$?: Observable<ProfileInfo>;

  getProfileInfo(): Observable<ProfileInfo> {
    if (this.profileInfo$) {
      return this.profileInfo$;
    }

    this.profileInfo$ = this.http.get<InfoResponse>(this.infoUrl).pipe(
      map((response: InfoResponse) => {
        const profileInfo: ProfileInfo = {
          activeProfiles: response.activeProfiles,
          inProduction: response.activeProfiles?.includes('prod'),
          openAPIEnabled: response.activeProfiles?.includes('api-docs'),
        };
        if (response.activeProfiles && response['display-ribbon-on-profiles'] != null) {
          const displayRibbonOnProfiles = response['display-ribbon-on-profiles'].split(',');
          const ribbonProfiles = displayRibbonOnProfiles.filter(
            (profile): boolean => response.activeProfiles?.includes(profile) as boolean,
          );
          if (ribbonProfiles.length > 0) {
            profileInfo.ribbonEnv = ribbonProfiles[0];
          }
        }
        profileInfo.gitInfo = mapGitInfo(response.git);
        return profileInfo;
      }),
      shareReplay(),
    );
    return this.profileInfo$;
  }
}

function mapGitInfo(git: InfoGitResponse | undefined): GitInfo | undefined {
  const id = git?.commit?.id;
  const idAbbrev = git?.commit?.['id.abbrev'];
  const branch = git?.branch;
  const time = git?.commit?.time;
  const userName = git?.commit?.user?.name;
  if (id == null || idAbbrev == null || branch == null || time == null || userName == null) {
    return undefined;
  }
  return {
    branch,
    commitHashShort: idAbbrev,
    commitHashFull: id,
    commitTime: time,
    lastCommitter: userName,
  };
}
