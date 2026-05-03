import { DestroyRef, Signal, WritableSignal, computed, signal } from '@angular/core';
import { SavingState, SavingStates } from 'app/shared/constants/saving-states';

export class AutosaveController {
  readonly metadataSavingState: WritableSignal<SavingState> = signal<SavingState>(SavingStates.SAVED);
  readonly operationSavingState: WritableSignal<SavingState> = signal<SavingState>(SavingStates.SAVED);
  readonly activeOperations: WritableSignal<number> = signal(0);
  readonly savingState: Signal<SavingState> = computed(() => {
    if (
      this.metadataSavingState() === SavingStates.SAVING ||
      this.operationSavingState() === SavingStates.SAVING ||
      this.activeOperations() > 0
    ) {
      return SavingStates.SAVING;
    }
    if (this.metadataSavingState() === SavingStates.FAILED || this.operationSavingState() === SavingStates.FAILED) {
      return SavingStates.FAILED;
    }
    return SavingStates.SAVED;
  });

  private autoSaveTimer: number | undefined;
  private autoSaveInitialized = false;
  private metadataStateBeforePendingSave: SavingState | undefined;
  private operationTimer: number | undefined;
  private operationStartedAt = 0;

  constructor(private readonly delayMs: number) {}

  shouldSkipInitialAutoSave(): boolean {
    if (!this.autoSaveInitialized) {
      this.autoSaveInitialized = true;
      return true;
    }
    return false;
  }

  scheduleMetadataSave(run: () => void): void {
    this.clearScheduledMetadataSave();
    this.metadataStateBeforePendingSave ??= this.metadataSavingState();
    this.metadataSavingState.set(SavingStates.SAVING);
    this.autoSaveTimer = window.setTimeout(() => {
      this.autoSaveTimer = undefined;
      run();
    }, this.delayMs);
  }

  clearScheduledMetadataSave(): void {
    if (this.autoSaveTimer !== undefined) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
      if (this.metadataStateBeforePendingSave !== undefined) {
        this.metadataSavingState.set(this.metadataStateBeforePendingSave);
      }
      this.metadataStateBeforePendingSave = undefined;
    }
  }

  markMetadataSaveSucceeded(): void {
    this.metadataStateBeforePendingSave = undefined;
    this.metadataSavingState.set(SavingStates.SAVED);
  }

  markMetadataSaveFailed(): void {
    this.metadataStateBeforePendingSave = undefined;
    this.metadataSavingState.set(SavingStates.FAILED);
  }

  startOperation(): void {
    this.clearOperationTimer();
    if (this.activeOperations() === 0) {
      this.operationStartedAt = Date.now();
    }
    this.operationSavingState.set(SavingStates.SAVING);
    this.activeOperations.update(count => count + 1);
  }

  finishOperation(state: SavingState): void {
    this.activeOperations.update(count => Math.max(0, count - 1));
    if (this.activeOperations() > 0) {
      if (state === SavingStates.FAILED) {
        this.operationSavingState.set(SavingStates.FAILED);
      }
      return;
    }

    const nextState =
      state === SavingStates.FAILED || this.operationSavingState() === SavingStates.FAILED ? SavingStates.FAILED : SavingStates.SAVED;
    const elapsed = Date.now() - this.operationStartedAt;
    const remainingDelay = Math.max(0, this.delayMs - elapsed);

    if (remainingDelay === 0) {
      this.operationSavingState.set(nextState);
      return;
    }

    this.operationTimer = window.setTimeout(() => {
      this.operationSavingState.set(nextState);
      this.operationTimer = undefined;
    }, remainingDelay);
  }

  dispose(): void {
    this.clearScheduledMetadataSave();
    this.clearOperationTimer();
  }

  private clearOperationTimer(): void {
    if (this.operationTimer !== undefined) {
      clearTimeout(this.operationTimer);
      this.operationTimer = undefined;
    }
  }
}

export function createAutosaveController(destroyRef: DestroyRef, delayMs = 2000): AutosaveController {
  const controller = new AutosaveController(delayMs);
  destroyRef.onDestroy(() => controller.dispose());
  return controller;
}
