import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';

@Component({
  selector: 'jhi-research-group-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, ButtonComponent, EditorComponent, TranslateModule, FontAwesomeModule],
  templateUrl: './research-group-info.component.html',
  styleUrl: './research-group-info.component.scss',
})
export class ResearchGroupInfoComponent {
  form: FormGroup;
  private fb = inject(FormBuilder);

  // TODO: Prefill with data from backend
  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      abbreviation: ['', [Validators.required]],
      groupHead: ['', [Validators.required]],
      campus: ['', [Validators.required]],
      website: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      description: [''],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      // TODO: Implement save functionality
    }
  }
}
