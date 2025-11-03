import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Provider } from '@angular/core';

/**
 * Mock type for ActivatedRoute with both paramMap and queryParamMap support.
 */
export interface ActivatedRouteMock {
  paramMapSubject: BehaviorSubject<ParamMap>;
  queryParamMapSubject: BehaviorSubject<ParamMap>;
  setParams: (params: Record<string, string>) => void;
  setQueryParams: (params: Record<string, string>) => void;
}

/**
 * Creates a mock ActivatedRoute that can emit both route and query parameter changes.
 */
export function createActivatedRouteMock(
  initialParams: Record<string, string> = {},
  initialQueryParams: Record<string, string> = {},
): ActivatedRouteMock {
  const paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(initialParams));
  const queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(initialQueryParams));

  const setParams = (params: Record<string, string>) => {
    paramMapSubject.next(convertToParamMap(params));
  };

  const setQueryParams = (params: Record<string, string>) => {
    queryParamMapSubject.next(convertToParamMap(params));
  };

  return { paramMapSubject, queryParamMapSubject, setParams, setQueryParams };
}

/**
 * Provides the mock to Angular’s DI.
 */
export function provideActivatedRouteMock(mock: ActivatedRouteMock): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      paramMap: mock.paramMapSubject.asObservable(),
      queryParamMap: mock.queryParamMapSubject.asObservable(),
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}),
      },
    },
  };
}
