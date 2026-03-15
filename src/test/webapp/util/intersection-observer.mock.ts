import { vi } from 'vitest';

export type IntersectionObserverMock = {
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  takeRecords: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  ctor: typeof IntersectionObserver;
};

export function createIntersectionObserverMock(): IntersectionObserverMock {
  const disconnect = vi.fn();
  const observe = vi.fn();
  const takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  const unobserve = vi.fn();

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [0];

    constructor(
      private readonly callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}

    disconnect = disconnect;

    observe = vi.fn((target: Element) => {
      observe(target);
      this.callback([{ isIntersecting: false, target } as IntersectionObserverEntry], this);
    });

    takeRecords = takeRecords;

    unobserve = unobserve;
  }

  return {
    disconnect,
    observe,
    takeRecords,
    unobserve,
    ctor: MockIntersectionObserver,
  };
}

export function installIntersectionObserverMock(mock: IntersectionObserverMock = createIntersectionObserverMock()): () => void {
  const previous = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = mock.ctor;

  return () => {
    if (previous) {
      globalThis.IntersectionObserver = previous;
    } else {
      delete (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
    }
  };
}
