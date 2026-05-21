export interface InfoResponse {
  'display-ribbon-on-profiles'?: string;
  git?: unknown;
  build?: unknown;
  activeProfiles?: string[];
}

export class ProfileInfo {
  constructor(
    public activeProfiles?: string[],
    public ribbonEnv?: string,
    public inProduction?: boolean,
    public openAPIEnabled?: boolean,
  ) {}
}
