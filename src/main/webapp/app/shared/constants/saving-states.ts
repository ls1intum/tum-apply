export const SavingStates = {
  SAVED: 'SAVED',
  SAVING: 'SAVING',
  FAILED: 'FAILED',
} as const;

export type SavingState = (typeof SavingStates)[keyof typeof SavingStates];

/**
 * Delay in milliseconds between the last user change and the next auto-save attempt.
 * Shared by every form that uses {@link AutoSaveController}.
 */
export const AUTO_SAVE_DELAY_MS = 2000;
