import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
export interface User {
  id: string;
  email: string;
  name: string;
  anonymous: boolean;
  bearer: string;
  authorities?: UserShortDTORolesEnum[];
}

export const ANONYMOUS_USER: User = {
  id: '',
  email: 'nomail',
  name: 'no user',
  anonymous: true,
  bearer: '',
};
