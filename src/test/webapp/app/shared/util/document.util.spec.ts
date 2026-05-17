import { describe, expect, it, vi } from 'vitest';

import { createTemporaryDocumentId, isTemporaryDocumentId } from 'app/shared/util/document.util';

describe('document.util', () => {
  it('should detect temporary document ids by the shared prefix rule', () => {
    expect(isTemporaryDocumentId('temp-upload-1')).toBe(true);
    expect(isTemporaryDocumentId('persisted-1')).toBe(false);
    expect(isTemporaryDocumentId(undefined)).toBe(false);
  });

  it('should generate temporary document ids with the shared prefix', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(createTemporaryDocumentId()).toBe('temp-12345-i');
  });
});
