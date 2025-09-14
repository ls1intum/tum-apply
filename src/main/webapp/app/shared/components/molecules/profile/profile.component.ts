import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-profile',
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule, TranslateDirective, TranslateModule, StringInputComponent],
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
