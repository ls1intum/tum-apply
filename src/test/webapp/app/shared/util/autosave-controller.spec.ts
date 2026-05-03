import { describe, expect, it, vi } from 'vitest';

import { AutosaveController } from 'app/shared/util/autosave-controller';
import { SavingStates } from 'app/shared/constants/saving-states';

describe('AutosaveController', () => {
  it('restores the previous metadata state when a pending autosave is canceled', () => {
    vi.useFakeTimers();
    try {
      const controller = new AutosaveController(2000);

      controller.scheduleMetadataSave(() => {});

      expect(controller.savingState()).toBe(SavingStates.SAVING);

      controller.clearScheduledMetadataSave();

      expect(controller.savingState()).toBe(SavingStates.SAVED);
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores a failed metadata state when a retry is canceled before the debounce fires', () => {
    vi.useFakeTimers();
    try {
      const controller = new AutosaveController(2000);
      controller.markMetadataSaveFailed();

      controller.scheduleMetadataSave(() => {});

      expect(controller.savingState()).toBe(SavingStates.SAVING);

      controller.clearScheduledMetadataSave();

      expect(controller.savingState()).toBe(SavingStates.FAILED);
    } finally {
      vi.useRealTimers();
    }
  });
});
