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
import { SelectComponent } from 'app/shared/components/atoms/select/select.component';

const TITLE_OPTIONS: ReadonlyArray<string> = ['Prof. Dr.', 'Prof.', 'Dr.'];

const TOAST_PREFIX = 'entity.applicationReferences';

/**
 * Step shown in the application creation flow when the underlying job has external
 * recommendation letters enabled. Lets the applicant add and remove referee contacts
 * (title / first name / last name / email). The invitation email is not sent here —
 * it goes out on application submit.
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
  styleUrl: './application-creation-references.component.scss',
})
export default class ApplicationCreationReferencesComponent {
  applicationId = input.required<string>();
  requiredCount = input<number>(0);

  valid = output<boolean>();

  references = signal<ReferenceRequestDTO[]>([]);
  loading = signal<boolean>(false);

  readonly titleOptions = TITLE_OPTIONS.map(value => ({ name: value, value: value }));

  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly referenceApi = inject(ReferenceRequestResourceApi);

  readonly addForm = this.formBuilder.nonNullable.group({
    title: this.formBuilder.nonNullable.control(''),
    firstName: this.formBuilder.nonNullable.control('', Validators.required),
    lastName: this.formBuilder.nonNullable.control('', Validators.required),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
  });

  /** Has the applicant added at least the required number of referees? */
  readonly stepValid = computed(() => this.references().length >= (this.requiredCount() ?? 0));

  private readonly initialized = signal<boolean>(false);

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
   * Submits the add form to the server, prepends the new entry to the local list, and resets the form.
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
          title: raw.title?.trim() || undefined,
          firstName: raw.firstName.trim(),
          lastName: raw.lastName.trim(),
          email: raw.email.trim(),
        }),
      );
      this.references.update(list => [...list, created]);
      this.addForm.reset({ title: '', firstName: '', lastName: '', email: '' });
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.addFailed`);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Removes a referee from the application. The request is irreversible, so the caller
   * is expected to confirm in the UI before invoking this method.
   *
   * @param reference the referee entry to remove
   */
  async onRemove(reference: ReferenceRequestDTO): Promise<void> {
    if (!reference.referenceRequestId) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.referenceApi.remove(this.applicationId(), reference.referenceRequestId));
      this.references.update(list => list.filter(r => r.referenceRequestId !== reference.referenceRequestId));
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.removeFailed`);
    } finally {
      this.loading.set(false);
    }
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.referenceApi.list(this.applicationId()));
      this.references.set(list ?? []);
    } catch {
      this.toastService.showErrorKey(`${TOAST_PREFIX}.toast.loadFailed`);
    } finally {
      this.loading.set(false);
    }
  }
}
