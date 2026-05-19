import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { dateOrderValidator, INVALID_DATE_ORDER_ERROR } from 'app/shared/validators/date-order-validator';

function createDateOrderGroup(applicationDeadline: string, startDate: string): FormGroup {
  return new FormGroup(
    {
      applicationDeadline: new FormControl(applicationDeadline),
      startDate: new FormControl(startDate),
    },
    {
      validators: [dateOrderValidator('applicationDeadline', 'startDate')],
    },
  );
}

describe('dateOrderValidator', () => {
  it.each([
    ['', '2025-02-01'],
    ['2025-02-01', ''],
    ['invalid', '2025-02-01'],
    ['2025-02-01', 'invalid'],
  ])('should return null when one value is missing or invalid: %s / %s', (applicationDeadline, startDate) => {
    const formGroup = createDateOrderGroup(applicationDeadline, startDate);

    expect(formGroup.errors).toBeNull();
  });

  it.each([
    ['2025-02-01', '2025-02-01'],
    ['2025-02-01', '2025-02-15'],
  ])('should accept valid date order: %s / %s', (applicationDeadline, startDate) => {
    const formGroup = createDateOrderGroup(applicationDeadline, startDate);

    expect(formGroup.errors).toBeNull();
  });

  it('should reject a start date before the application deadline', () => {
    const formGroup = createDateOrderGroup('2025-02-15', '2025-02-01');

    expect(formGroup.errors).toEqual({ [INVALID_DATE_ORDER_ERROR]: true });
  });
});
