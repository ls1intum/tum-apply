export class MockKeycloakService {
  init = jest.fn(() => Promise.resolve(true));
  login = jest.fn(() => Promise.resolve());
  logout = jest.fn(() => Promise.resolve());
  getToken = jest.fn(() => 'mock-token');
  getUsername = jest.fn(() => 'mockuser');
  getFirstName = jest.fn(() => 'MockFirstName');
  hasRole = jest.fn((role: string) => role === 'mock-role');
  getUserRoles = jest.fn(() => ['mock-role']);
  isLoggedIn = jest.fn(() => true);
}
