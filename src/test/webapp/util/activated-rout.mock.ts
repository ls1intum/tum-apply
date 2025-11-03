import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Provider } from '@angular/core';

export interface ActivatedRouteMock {
  paramMapSubject: BehaviorSubject<ParamMap>;

  setParams: (params: Record<string, string>) => void;
}

/**
 * Creates a mock for ActivatedRoute with reactive paramMap handling.
 */
export function createActivatedRouteMock(initialParams: Record<string, string> = {}): ActivatedRouteMock {
  const paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(initialParams));

  const setParams = (params: Record<string, string>) => {
    paramMapSubject.next(convertToParamMap(params));
  };

  return { paramMapSubject, setParams };
}

/**
 * Provides the mock ActivatedRoute to Angular's TestBed.
 */
export function provideActivatedRouteMock(mock: ActivatedRouteMock): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      paramMap: mock.paramMapSubject.asObservable(),
    },
  };
}
