export const SavingStates = {
  SAVED: 'SAVED',
  SAVING: 'SAVING',
  FAILED: 'FAILED',
  VALIDATION_BLOCKED: 'VALIDATION_BLOCKED',
} as const;

export type SavingState = (typeof SavingStates)[keyof typeof SavingStates];
