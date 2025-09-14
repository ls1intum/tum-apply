import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import TranslateDirective from '../../../language/translate.directive';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';

@Component({
  selector: 'jhi-profile',
  imports: [CommonModule, ReactiveFormsModule, TranslateDirective, StringInputComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  submitHandler = input<() => void>(() => {});

  form = new FormGroup({
    firstName: new FormControl<string>(''),
    lastName: new FormControl<string>(''),
  });
}
