import { Directive, EffectRef, Signal, effect, inject, model, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged } from 'rxjs';

export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

@Directive()
export abstract class ApplicationCreationPageBaseComponent<T extends Record<string, any>> {
  data = model<T>();

  valid = output<boolean>();
  changed = output<boolean>();

  fb = inject(FormBuilder);

  hasInitialized = signal(false);

  abstract get pageForm(): FormGroup;
  abstract get formValue(): Signal<T>;

  private updateEffectRef?: EffectRef;

  formValue$(): Observable<T> {
    return this.pageForm.valueChanges.pipe(debounceTime(100), distinctUntilChanged(deepEqual));
  }

  get formStatus(): Signal<string> {
    return toSignal(this.pageForm.statusChanges, {
      initialValue: this.pageForm.status,
    });
  }

  abstract initializeFormEffect: EffectRef;

  get updateEffect(): EffectRef {
    return (this.updateEffectRef ??= effect(() => {
      if (!this.hasInitialized()) return;
      const data = untracked(() => this.data());
      const raw = this.formValue();
      const normalized = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v ?? ''])) as T;

      const newData = { ...data, ...normalized };
      if (!deepEqual(newData, data)) {
        this.data.set(newData);
        this.changed.emit(true);
      }

      this.valid.emit(this.pageForm.valid);
    }));
  }

  emitChanged(): void {
    this.changed.emit(true);
  }
}
