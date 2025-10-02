import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { ButtonComponent } from '../../../../atoms/button/button.component';
import { StringInputComponent } from '../../../../atoms/string-input/string-input.component';

@Component({
  selector: 'jhi-professor-request-access-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, ButtonComponent, TranslateModule],
  templateUrl: './professor-request-access-form.component.html',
  styleUrl: './professor-request-access-form.component.scss',
})
export class ProfessorRequestAccessFormComponent {
  // Form
  professorForm = this.createProfessorForm();

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(DynamicDialogRef, { optional: true });
  private readonly translate = inject(TranslateService);

  onSubmit(): void {
    if (this.professorForm.valid) {
      console.warn('Form Data:', this.professorForm.value);
      this.ref?.close();
    }
  }

  onCancel(): void {
    this.ref?.close();
  }

  private createProfessorForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      tumID: ['', [Validators.required]],
      researchGroupHead: ['', [Validators.required]],
      researchGroupName: ['', [Validators.required]],
      researchGroupAbbreviation: [''],
      researchGroupContactEmail: [''],
      researchGroupWebsite: [''],
      researchGroupSchool: [''],
      researchGroupDescription: [''],
      researchGroupFieldOfStudies: [''],
      researchGroupStreetAndNumber: [''],
      researchGroupPostalCode: [''],
      researchGroupCity: [''],
      additionalNotes: [''],
    });
  }
}
