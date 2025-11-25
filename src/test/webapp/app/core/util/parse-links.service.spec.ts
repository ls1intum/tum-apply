import { TestBed } from '@angular/core/testing';

import { ParseLinks } from 'app/core/util/parse-links.service';

describe('Parse links service test', () => {
  let service: ParseLinks;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParseLinks],
    });
    service = TestBed.inject(ParseLinks);
  });

  describe('parse', () => {
    it('should throw error for invalid input', () => {
      expect(() => service.parse('')).toThrowError('input must not be of zero length');
    });

    it('should return links when headers are passed', () => {
      const links = { last: 0, first: 0 };
      expect(service.parse(' </api/audits?page=0&size=20>; rel="last",</api/audits?page=0&size=20>; rel="first"')).toEqual(links);
    });
  });

  describe('parseAll', () => {
    it('should throw error for invalid input', () => {
      expect(() => service.parseAll('')).toThrowError('input must not be of zero length');
    });

    it('should return links when headers are passed', () => {
      const links = { last: { page: '0', size: '20' }, first: { page: '0', size: '20' } };
      expect(service.parseAll(' </api/audits?page=0&size=20>; rel="last",</api/audits?page=0&size=20>; rel="first"')).toEqual(links);
    });
  });
});
