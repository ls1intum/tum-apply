export const SavingStates = {
  SAVED: 'SAVED',
  SAVING: 'SAVING',
  FAILED: 'FAILED',
} as const;

export type SavingState = (typeof SavingStates)[keyof typeof SavingStates];
