import { describe, expect, it } from 'vitest';
import { BiasedIssue, BiasedIssueTypeEnum } from 'app/generated/model/biased-issue';
import { computeCodingStatus } from 'app/shared/gender-bias-analysis/gender-bias-analysis.utils';

describe('computeCodingStatus', () => {
  it.each<[string, BiasedIssue[] | undefined]>([
    ['no analysis is available', undefined],
    ['analysis is empty by default', []],
  ])('should return undefined when %s', (_label, result) => {
    expect(computeCodingStatus(result)).toBeUndefined();
  });

  it.each<[string, BiasedIssue[], BiasedIssueTypeEnum, { emptyAsNeutral?: boolean } | undefined]>([
    ['empty analysis should be treated as neutral', [], 'NEUTRAL', { emptyAsNeutral: true }],
    ['inclusive and non-inclusive issue counts are balanced', [{ type: 'NON_INCLUSIVE' }, { type: 'INCLUSIVE' }], 'NEUTRAL', undefined],
    [
      'non-inclusive issues outnumber inclusive issues',
      [{ type: 'NON_INCLUSIVE' }, { type: 'NON_INCLUSIVE' }, { type: 'INCLUSIVE' }],
      'NON_INCLUSIVE',
      undefined,
    ],
    [
      'inclusive issues outnumber non-inclusive issues',
      [{ type: 'INCLUSIVE' }, { type: 'INCLUSIVE' }, { type: 'NON_INCLUSIVE' }],
      'INCLUSIVE',
      undefined,
    ],
  ])('should return %s when %s', (_label, result, expectedStatus, options) => {
    expect(computeCodingStatus(result, options)).toBe(expectedStatus);
  });
});
