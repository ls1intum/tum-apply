import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { firstValueFrom } from 'rxjs';
import { UserAdminResourceApi } from 'app/generated/api/user-admin-resource-api';
import { AdminUserDetailDTO } from 'app/generated/model/admin-user-detail-dto';
import { CreateUserDTO } from 'app/generated/model/create-user-dto';
import { ImportUserDTO } from 'app/generated/model/import-user-dto';
import { UpdateUserDTO } from 'app/generated/model/update-user-dto';
import { ToastService } from 'app/service/toast-service';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { selectGender } from 'app/shared/constants/genders';
import { TranslateDirective } from 'app/shared/language';
import { selectNationality } from 'app/shared/language/nationalities';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';

// nosemgrep: javascript.security.hard-coded-password
const TRANSLATION_KEY = 'manageUsersPage';

type FormMode = 'create' | 'edit' | 'import';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Admin form for creating, importing, editing, and deleting a user.
 * The mode is derived from the route + query params:
 * - `/manage-users/create` becomes create
 * - `/manage-users/create?mode=import` becomes import
 * - `/manage-users/:userId` becomes edit
 */
@Component({
  selector: 'jhi-manage-user-form',
  imports: [
    BackButtonComponent,
    ButtonComponent,
    ConfirmDialog,
    DatePickerComponent,
    DividerModule,
    LocalizedDatePipe,
    ReactiveFormsModule,
    SelectComponent,
    StringInputComponent,
    TranslateDirective,
    TranslateModule,
  ],
  templateUrl: './manage-user-form.component.html',
})
export class ManageUserFormComponent {
  // ------- Signals: mode + state -------
  readonly mode = signal<FormMode>('create');
  readonly loadedUser = signal<AdminUserDetailDTO | undefined>(undefined);
  readonly isSubmitting = signal<boolean>(false);
  readonly showDeleteDialog = signal<boolean>(false);

  // ------- Select options -------
  readonly genderOptions: SelectOption[] = selectGender;
  readonly nationalityOptionsBase: SelectOption[] = selectNationality;
  readonly languageOptions: SelectOption[] = [
    { value: 'en', name: 'languages.en' },
    { value: 'de', name: 'languages.de' },
  ];

  // ------- Selected select-option signals -------
  readonly selectedGender = signal<SelectOption | undefined>(undefined);
  readonly selectedNationality = signal<SelectOption | undefined>(undefined);
  readonly selectedLanguage = signal<SelectOption | undefined>(undefined);
  readonly birthday = signal<string>('');

  // ------- Date bounds -------
  readonly minBirthday = new Date(1900, 0, 1);
  readonly maxBirthday = new Date();
  readonly defaultBirthday = new Date(2000, 0, 1);

  // ------- Reactive form (public for template) -------
  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    keycloakUserId: [''],
    universityId: [''],
    phoneNumber: [''],
    website: [''],
    linkedinUrl: [''],
  });

  // ------- Computed view-model fields -------
  readonly title = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return `${TRANSLATION_KEY}.form.editTitle`;
      case 'import':
        return `${TRANSLATION_KEY}.form.importTitle`;
      default:
        return `${TRANSLATION_KEY}.form.createTitle`;
    }
  });

  readonly submitLabel = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return `${TRANSLATION_KEY}.form.buttons.save`;
      case 'import':
        return `${TRANSLATION_KEY}.form.buttons.importUser`;
      default:
        return `${TRANSLATION_KEY}.form.buttons.createUser`;
    }
  });

  /** Translation key for the page block; exposed for use in the template. */
  readonly translationKey = TRANSLATION_KEY;

  // ------- Injected services -------
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly userAdminApi = inject(UserAdminResourceApi);

  // Effect that sets mode from route params + loads user when in edit.
  private readonly modeEffect = effect(() => {
    const params = this.route.snapshot.paramMap;
    const queryParams = this.route.snapshot.queryParamMap;
    const userId = params.get('userId');
    const queryMode = queryParams.get('mode');

    let nextMode: FormMode = 'create';
    if (userId !== null && userId !== '') {
      nextMode = 'edit';
    } else if (queryMode === 'import') {
      nextMode = 'import';
    }
    this.mode.set(nextMode);
    this.applyValidatorsForMode(nextMode);

    if (nextMode === 'edit' && userId !== null && userId !== '') {
      void this.loadUser(userId);
    }
  });

  /**
   * Submit the form for the current mode. Routes to the matching API call.
   */
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      switch (this.mode()) {
        case 'create':
          await this.submitCreate();
          break;
        case 'import':
          await this.submitImport();
          break;
        case 'edit':
          await this.submitUpdate();
          break;
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Open the delete confirmation dialog for the loaded user (edit mode only).
   */
  onRequestDelete(): void {
    if (this.mode() !== 'edit') {
      return;
    }
    this.showDeleteDialog.set(true);
  }

  /**
   * Confirm deletion handler bound to the confirm-dialog. Deletes the loaded
   * user from Keycloak and anonymises their database references.
   */
  async onConfirmDelete(): Promise<void> {
    const userId = this.loadedUser()?.userId;
    if (userId === undefined || userId === '') {
      return;
    }
    try {
      await firstValueFrom(this.userAdminApi.deleteUser(userId));
      this.toastService.showSuccess({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.deleteSuccess`),
      });
      void this.router.navigate(['/manage-users']);
    } catch (error) {
      this.toastService.showError({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.deleteFailed`, {
          detail: this.extractErrorDetail(error),
        }),
      });
    }
  }

  updateGender(option: SelectOption | undefined): void {
    this.selectedGender.set(option);
  }

  updateNationality(option: SelectOption | undefined): void {
    this.selectedNationality.set(option);
  }

  updateLanguage(option: SelectOption | undefined): void {
    this.selectedLanguage.set(option);
  }

  updateBirthday(value: string | undefined): void {
    this.birthday.set(value ?? '');
  }

  /**
   * Apply mode-specific validators. Reactive Forms only — controls always exist.
   *
   * @param mode the current form mode
   */
  private applyValidatorsForMode(mode: FormMode): void {
    const passwordControl = this.form.controls.password;
    const keycloakControl = this.form.controls.keycloakUserId;
    const firstNameControl = this.form.controls.firstName;
    const lastNameControl = this.form.controls.lastName;
    const emailControl = this.form.controls.email;

    if (mode === 'create') {
      passwordControl.setValidators([Validators.required, Validators.pattern(PASSWORD_PATTERN)]);
      keycloakControl.clearValidators();
      firstNameControl.setValidators([Validators.required]);
      lastNameControl.setValidators([Validators.required]);
      emailControl.setValidators([Validators.required, Validators.email]);
    } else if (mode === 'import') {
      passwordControl.clearValidators();
      keycloakControl.setValidators([Validators.required]);
      firstNameControl.clearValidators();
      lastNameControl.clearValidators();
      emailControl.clearValidators();
    } else {
      // edit
      passwordControl.clearValidators();
      keycloakControl.clearValidators();
      firstNameControl.setValidators([Validators.required]);
      lastNameControl.setValidators([Validators.required]);
      emailControl.setValidators([Validators.required, Validators.email]);
    }

    passwordControl.updateValueAndValidity({ emitEvent: false });
    keycloakControl.updateValueAndValidity({ emitEvent: false });
    firstNameControl.updateValueAndValidity({ emitEvent: false });
    lastNameControl.updateValueAndValidity({ emitEvent: false });
    emailControl.updateValueAndValidity({ emitEvent: false });
  }

  private async loadUser(userId: string): Promise<void> {
    try {
      const user = await firstValueFrom(this.userAdminApi.getUser(userId));
      this.loadedUser.set(user);
      this.form.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        universityId: user.universityId ?? '',
        phoneNumber: user.phoneNumber ?? '',
        website: user.website ?? '',
        linkedinUrl: user.linkedinUrl ?? '',
      });
      this.form.controls.email.disable({ emitEvent: false });
      this.selectedGender.set(this.findOption(this.genderOptions, user.gender));
      this.selectedNationality.set(this.findOption(this.nationalityOptionsBase, user.nationality));
      this.selectedLanguage.set(this.findOption(this.languageOptions, user.selectedLanguage));
      this.birthday.set(user.birthday ?? '');
    } catch {
      this.toastService.showErrorKey(`${TRANSLATION_KEY}.errors.loadUser`);
    }
  }

  private async submitCreate(): Promise<void> {
    const value = this.form.getRawValue();
    const dto: CreateUserDTO = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      password: value.password,
      universityId: this.emptyToUndefined(value.universityId),
      phoneNumber: this.emptyToUndefined(value.phoneNumber),
      website: this.emptyToUndefined(value.website),
      linkedinUrl: this.emptyToUndefined(value.linkedinUrl),
      gender: this.selectOptionValue(this.selectedGender()),
      nationality: this.selectOptionValue(this.selectedNationality()),
      selectedLanguage: this.selectOptionValue(this.selectedLanguage()),
      birthday: this.emptyToUndefined(this.birthday()),
    };

    try {
      const created = await firstValueFrom(this.userAdminApi.createUser(dto));
      this.toastService.showSuccess({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.createSuccess`),
      });
      void this.router.navigate(['/manage-users', created.userId]);
    } catch (error) {
      this.toastService.showError({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.createFailed`, {
          detail: this.extractErrorDetail(error),
        }),
      });
    }
  }

  private async submitImport(): Promise<void> {
    const value = this.form.getRawValue();
    const dto: ImportUserDTO = { keycloakUserId: value.keycloakUserId };
    try {
      const imported = await firstValueFrom(this.userAdminApi.importUser(dto));
      this.toastService.showSuccess({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.importSuccess`),
      });
      void this.router.navigate(['/manage-users', imported.userId]);
    } catch (error) {
      this.toastService.showError({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.importFailed`, {
          detail: this.extractErrorDetail(error),
        }),
      });
    }
  }

  private async submitUpdate(): Promise<void> {
    const userId = this.loadedUser()?.userId;
    if (userId === undefined || userId === '') {
      return;
    }
    const value = this.form.getRawValue();
    const dto: UpdateUserDTO = {
      firstName: value.firstName,
      lastName: value.lastName,
      universityId: this.emptyToUndefined(value.universityId),
      phoneNumber: this.emptyToUndefined(value.phoneNumber),
      website: this.emptyToUndefined(value.website),
      linkedinUrl: this.emptyToUndefined(value.linkedinUrl),
      gender: this.selectOptionValue(this.selectedGender()),
      nationality: this.selectOptionValue(this.selectedNationality()),
      selectedLanguage: this.selectOptionValue(this.selectedLanguage()),
      birthday: this.emptyToUndefined(this.birthday()),
    };

    try {
      const updated = await firstValueFrom(this.userAdminApi.updateUser(userId, dto));
      this.loadedUser.set(updated);
      this.toastService.showSuccess({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.updateSuccess`),
      });
    } catch (error) {
      this.toastService.showError({
        summary: this.translate.instant(`${TRANSLATION_KEY}.toastMessages.updateFailed`, {
          detail: this.extractErrorDetail(error),
        }),
      });
    }
  }

  private findOption(options: SelectOption[], value: string | undefined): SelectOption | undefined {
    if (value === undefined || value === '') return undefined;
    return options.find(option => option.value === value);
  }

  private selectOptionValue(option: SelectOption | undefined): string | undefined {
    if (option === undefined) return undefined;
    return typeof option.value === 'string' ? option.value : String(option.value);
  }

  private emptyToUndefined(value: string | undefined): string | undefined {
    return value !== undefined && value !== '' ? value : undefined;
  }

  private extractErrorDetail(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return '';
  }
}
