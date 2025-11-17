
import { TestBed } from '@angular/core/testing';
import { TimeAgoPipe } from '../../../../../../src/main/webapp/app/shared/pipes/time-ago.pipe';
import { TranslateService } from '@ngx-translate/core';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: vi.fn((key: string, params?: any) => {
              if (key === 'time.justNow') return 'just now';
              if (key === 'time.ago') return `${params.count} ${params.unit} ago`;
              if (key.startsWith('time.units.')) {
                const unit = key.replace('time.units.', '').replace('Plural', 's');
                return unit;
              }
              return key;
            }),
          },
        },
      ],
    });
    translate = TestBed.inject(TranslateService);
    pipe = TestBed.runInInjectionContext(() => new TimeAgoPipe());
  });

  it('should return empty string for falsy value', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should return just now for < 60 seconds', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('just now');
    expect(pipe.transform(new Date(Date.now() - 30 * 1000))).toBe('just now');
  });

  it('should return minutes ago', () => {
    expect(pipe.transform(new Date(Date.now() - 2 * 60 * 1000))).toBe('2 minutes ago');
  });

  it('should return hours ago', () => {
    expect(pipe.transform(new Date(Date.now() - 3 * 60 * 60 * 1000))).toBe('3 hours ago');
  });

  it('should return days ago', () => {
    expect(pipe.transform(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))).toBe('2 days ago');
  });

  it('should return months ago', () => {
    expect(pipe.transform(new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000))).toBe('3 months ago');
  });

  it('should return years ago', () => {
    expect(pipe.transform(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000))).toBe('2 years ago');
  });

  it('should handle string date input', () => {
    const dateStr = new Date(Date.now() - 60 * 1000).toISOString();
    expect(pipe.transform(dateStr)).toBe('1 minute ago');
  });
});
