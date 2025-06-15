import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';

@Component({
  selector: 'jhi-editor-playground',
  imports: [EditorComponent, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './editor-playground.component.html',
  styleUrl: './editor-playground.component.scss',
})
export class EditorPlaygroundComponent {
  motivation = signal<string>('');

  valid = output<boolean>();

  fb = inject(FormBuilder);
  form = computed(() => {
    const currentData = this.motivation();
    return this.fb.group({
      firstName: [currentData, Validators.required],
    });
  });

  constructor() {
    effect(onCleanup => {
      const form = this.form();
      const valueSubscription = form.valueChanges.subscribe(value => {
        this.motivation.set(value.firstName ?? '');
        this.valid.emit(form.valid);
      });

      const statusSubscription = form.statusChanges.subscribe(() => {
        this.valid.emit(form.valid);
      });

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }
}
