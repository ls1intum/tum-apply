import { getApplicationPDFLabels } from 'app/application/pdf-labels';

class MockTranslateService {
  calls: string[] = [];
  instant(key: string): string {
    this.calls.push(key);
    return `t(${key})`;
  }
}

describe('getApplicationPDFLabels', () => {
  it('returns all expected keys with translated values', () => {
    const translate = new MockTranslateService() as any;
    const labels = getApplicationPDFLabels(translate);
    // Expected keys from implementation
    const expectedKeys = [
      'application','headline','overview','supervisor','researchGroup','location','personalStatements',
      'motivation','skills','researchExperience','personalInformation','applicantInfo','preferredLanguage',
      'desiredStartDate','gender','nationality','website','linkedIn','bachelorInfo','masterInfo','degreeName',
      'university','upperGradeLimit','lowerGradeLimit','grade'
    ];
    expect(Object.keys(labels)).toEqual(expectedKeys);
    // Each value should be translation wrapper
    expectedKeys.forEach(k => {
      expect(labels[k]).toMatch(/^t\(/);
    });
    // Ensure instant was called once per key with correct translation keys
    expect(translate.calls.length).toBe(expectedKeys.length);
    // Spot check a couple of translation keys
    expect(translate.calls).toContain('evaluation.application');
    expect(translate.calls).toContain('entity.application_detail.personal_information');
    expect(translate.calls).toContain('entity.detail_card.upper_passing_limit');
  });

  it('produces distinct values for different keys', () => {
    const translate = new MockTranslateService() as any;
    const labels = getApplicationPDFLabels(translate);
    const uniqueValues = new Set(Object.values(labels));
    expect(uniqueValues.size).toBe(Object.keys(labels).length);
  });
});
