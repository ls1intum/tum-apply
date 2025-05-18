export class Account {
  constructor(
    public authorities: string[],
    public email: string,
    public firstName: string | null,
    public lastName: string | null,
    public login: string,
  ) {}
}
