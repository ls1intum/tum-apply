import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ReferenceRequestResourceApi } from 'app/generated/api/reference-request-resource-api';
import { ReferenceRequestDTO } from 'app/generated/model/reference-request-dto';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';

const TITLE_OPTIONS: readonly string[] = ['Prof. Dr.', 'Prof.', 'Dr.'];

const TOAST_PREFIX = 'entity.applicationReferences';

/**
 * Step shown in the application creation flow when the underlying job has external
 * recommendation letters enabled. Lets the applicant add and remove referee contacts
 * (title / first name / last name / email).
 */
@Component({
  selector: 'jhi-application-creation-references',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    TranslateDirective,
    FontAwesomeModule,
    DividerModule,
    SelectModule,
    ButtonComponent,
    StringInputComponent,
    SelectComponent,
  ],
  templateUrl: './application-creation-references.component.html',
})
export default class ApplicationCreationReferencesComponent {
  applicationId = input.required<string>();
  requiredCount = input<number>(0);

  valid = output<boolean>();
  referencesChanged = output<ReferenceRequestDTO[]>();

  references = signal<ReferenceRequestDTO[]>([]);
  loading = signal<boolean>(false);

  readonly titleOptions: SelectOption[] = TITLE_OPTIONS.map(value => ({ name: value, value }));
  readonly selectedTitleOption = signal<SelectOption | undefined>(undefined);

  readonly formBuilder = inject(FormBuilder);

  readonly addForm = this.formBuilder.nonNullable.group({
    title: this.formBuilder.nonNullable.control(''),
    firstName: this.formBuilder.nonNullable.control('', Validators.required),
    lastName: this.formBuilder.nonNullable.control('', Validators.required),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email, Validators.pattern(/.+\..{2,}$/)]),
  });

  /** Has the applicant added at least the required number of referees? */
  readonly stepValid = computed(() => this.references().length >= this.requiredCount());

  private readonly initialized = signal<boolean>(false);
  private readonly toastService = inject(ToastService);
  private readonly referenceApi = inject(ReferenceRequestResourceApi);

  /**
   * Reload the list whenever the active applicationId becomes available.
   * Independent of auto-save: each add/remove is persisted directly.
   */
  private readonly loadEffect = effect(() => {
    const id = this.applicationId();
    if (!id || this.initialized()) return;
    this.initialized.set(true);
    void this.refresh();
  });

  private readonly emitValidEffect = effect(() => {
    this.valid.emit(this.stepValid());
  });

  /**
   * Updates the bound form control whenever the title dropdown selection changes.
   */
  onTitleSelected(option: SelectOption): void {
    this.selectedTitleOption.set(option);
    this.addForm.controls.title.setValue(typeof option.value === 'string' ? option.value : '');
  }

  /**
   * Adds a new referee to the application by sending the entered data to the server.
   * On success, the new entry is added to the local list and the form is reset.
   */
  async onAdd(): Promise<void> {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const raw = this.addForm.getRawValue();
    this.loading.set(true);
    try {
      const created = await firstValueFrom(
        this.referenceApi.add(this.applicationId(), {
          title: raw.title.trim() || undefined,
          firstName: raw.firstName.trim(),
          lastName: raw.lastName.trim(),
          email: raw.email.trim(),
        }),
      );
      this.references.update(list => list.concat(created));
      this.referencesChanged.emit(this.references());
      this.resetAddForm();
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.addFailed`);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Removes the given referee from the application by sending a delete request to the server.
   * On success, the entry is removed from the local list.
   *
   * @param reference the referee entry to remove
   */
  async onRemove(reference: ReferenceRequestDTO): Promise<void> {
    if (!reference.referenceRequestId) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.referenceApi.remove(this.applicationId(), reference.referenceRequestId));
      this.references.update(list => list.filter(r => r.referenceRequestId !== reference.referenceRequestId));
      this.referencesChanged.emit(this.references());
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.removeFailed`);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clears the add form value and resets validation state so the inputs render as
   * pristine and untouched after a successful submit.
   */
  private resetAddForm(): void {
    this.selectedTitleOption.set(undefined);
    this.addForm.reset({ title: '', firstName: '', lastName: '', email: '' });
    this.addForm.markAsPristine();
    this.addForm.markAsUntouched();
    Object.values(this.addForm.controls).forEach(control => {
      control.markAsPristine();
      control.markAsUntouched();
    });
  }

  /**
   * Loads the current list of references from the server and updates the local state.
   */
  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.referenceApi.list(this.applicationId()));
      this.references.set(list);
      this.referencesChanged.emit(this.references());
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.loadFailed`);
    } finally {
      this.loading.set(false);
    }
  }
}
