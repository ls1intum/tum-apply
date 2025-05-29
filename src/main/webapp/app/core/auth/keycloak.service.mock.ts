export class MockKeycloakService {
  init = jest.fn(() => Promise.resolve(true));
  login = jest.fn();
  logout = jest.fn();
  getToken = jest.fn(() => 'mock-token');
  getUsername = jest.fn(() => 'mockuser');
  hasRole = jest.fn(() => false);
  getUserRoles = jest.fn(() => []);
  isLoggedIn = jest.fn(() => true);
}
