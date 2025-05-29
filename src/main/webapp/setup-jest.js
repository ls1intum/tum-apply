// src/setup-jest.js
global.ResizeObserver = class {
  observe() {}

  unobserve() {}

  disconnect() {}
};
