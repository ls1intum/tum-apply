export class Account {
  constructor(
    public roles: string[],
    public email: string,
    public firstName: string | null,
    public lastName: string | null,
  ) {}
}
