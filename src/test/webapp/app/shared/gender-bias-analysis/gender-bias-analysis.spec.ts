import { describe, expect, it } from 'vitest';
import { BiasedIssue, BiasedIssueTypeEnum } from 'app/generated/model/biased-issue';
import { computeCodingStatus } from 'app/shared/gender-bias-analysis/gender-bias-analysis.utils';

describe('computeCodingStatus', () => {
  it.each<[string, BiasedIssue[] | undefined]>([
    ['undefined', undefined],
    ['empty', []],
  ])('should return undefined for %s result', (_label, result) => {
    expect(computeCodingStatus(result)).toBeUndefined();
  });

  it.each<[BiasedIssueTypeEnum, string, BiasedIssue[], { emptyAsNeutral?: boolean } | undefined]>([
    ['NEUTRAL', 'empty result', [], { emptyAsNeutral: true }],
    ['NEUTRAL', 'balanced result', [{ type: 'NON_INCLUSIVE' }, { type: 'INCLUSIVE' }], undefined],
    [
      'NON_INCLUSIVE',
      'mostly non-inclusive result',
      [{ type: 'NON_INCLUSIVE' }, { type: 'NON_INCLUSIVE' }, { type: 'INCLUSIVE' }],
      undefined,
    ],
    ['INCLUSIVE', 'mostly inclusive result', [{ type: 'INCLUSIVE' }, { type: 'INCLUSIVE' }, { type: 'NON_INCLUSIVE' }], undefined],
  ])('should return %s for %s', (expectedStatus, _label, result, options) => {
    expect(computeCodingStatus(result, options)).toBe(expectedStatus);
  });
});
