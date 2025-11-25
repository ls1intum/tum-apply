import { ActivatedRoute, convertToParamMap, ParamMap, UrlSegment } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Provider } from '@angular/core';

/**
 * Mock type for ActivatedRoute with paramMap, queryParamMap, and URL segment support.
 */
export interface ActivatedRouteMock {
  paramMapSubject: BehaviorSubject<ParamMap>;
  queryParamMapSubject: BehaviorSubject<ParamMap>;
  urlSubject: BehaviorSubject<UrlSegment[]>;
  setParams: (params: Record<string, string>) => void;
  setQueryParams: (params: Record<string, string>) => void;
  setUrl: (segments: UrlSegment[]) => void;
}

/**
 * Creates a mock ActivatedRoute that can emit route params, query params, and URL segment changes.
 */
export function createActivatedRouteMock(
  initialParams: Record<string, string> = {},
  initialQueryParams: Record<string, string> = {},
  initialUrlSegments: UrlSegment[] = [],
): ActivatedRouteMock {
  const paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(initialParams));
  const queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(initialQueryParams));
  const urlSubject = new BehaviorSubject<UrlSegment[]>(initialUrlSegments);

  const setParams = (params: Record<string, string>) => {
    paramMapSubject.next(convertToParamMap(params));
  };

  const setQueryParams = (params: Record<string, string>) => {
    queryParamMapSubject.next(convertToParamMap(params));
  };

  const setUrl = (segments: UrlSegment[]) => {
    urlSubject.next(segments);
  };

  return { paramMapSubject, queryParamMapSubject, urlSubject, setParams, setQueryParams, setUrl };
}

/**
 * Provides the mock to Angular's DI.
 */
export function provideActivatedRouteMock(mock: ActivatedRouteMock): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      paramMap: mock.paramMapSubject.asObservable(),
      queryParamMap: mock.queryParamMapSubject.asObservable(),
      url: mock.urlSubject.asObservable(),
      get snapshot() {
        return {
          paramMap: mock.paramMapSubject.value,
          queryParamMap: mock.queryParamMapSubject.value,
          url: mock.urlSubject.value,
        };
      },
    },
  };
}
