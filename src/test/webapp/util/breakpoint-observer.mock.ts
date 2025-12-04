import { Provider } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { vi } from 'vitest';
import { of } from 'rxjs';

export type BreakpointObserverMock = {
  observe: ReturnType<typeof vi.fn>;
};

function buildBreakpoints(breakpoints: Partial<Record<string, boolean>> = {}) {
  return {
    [Breakpoints.XSmall]: breakpoints[Breakpoints.XSmall] ?? false,
    [Breakpoints.Small]: breakpoints[Breakpoints.Small] ?? false,
    [Breakpoints.XLarge]: breakpoints[Breakpoints.XLarge] ?? false,
  };
}

export function createBreakpointObserverMock(
  breakpointState: {
    matches?: boolean;
    breakpoints?: Partial<Record<string, boolean>>;
  } = {},
): BreakpointObserverMock {
  return {
    observe: vi.fn(() =>
      of({
        matches: breakpointState.matches ?? false,
        breakpoints: buildBreakpoints(breakpointState.breakpoints),
      }),
    ),
  };
}

export function provideBreakpointObserverMock(mock: BreakpointObserverMock = createBreakpointObserverMock()): Provider {
  return { provide: BreakpointObserver, useValue: mock };
}
