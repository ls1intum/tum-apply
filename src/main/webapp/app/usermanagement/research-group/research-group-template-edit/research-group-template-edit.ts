import { Component, ViewEncapsulation, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuillEditorComponent } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TabsModule } from 'primeng/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import 'quill-mention/autoregister';
import { EmailTemplateDTO, EmailTemplateDTOEmailTypeEnum } from 'app/generated/model/email-template-dto';
import { EmailTemplateTranslationDTO } from 'app/generated/model/email-template-translation-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';

import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { EmailTemplateResourceApi } from '../../../generated/api/email-template-resource-api';
import { AccountService } from '../../../core/auth/account.service';

const EMPTY_TRANSLATION: EmailTemplateTranslationDTO = { subject: '', body: '' };
const AUTOSAVE_DELAY_MS = 3000;

@Component({
  selector: 'jhi-research-group-template-edit',
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    StringInputComponent,
    TabsModule,
    QuillEditorComponent,
    BackButtonComponent,
    SelectComponent,
    TranslateModule,
    TranslateDirective,
  ],
  templateUrl: './research-group-template-edit.html',
  styleUrl: './research-group-template-edit.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ResearchGroupTemplateEdit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly emailTemplateApi = inject(EmailTemplateResourceApi);
  readonly translate = inject(TranslateService);
  readonly toastService = inject(ToastService);
  readonly accountService = inject(AccountService);

  autoSaveTimer: number | undefined;

  readonly savingState = signal<'SAVED' | 'SAVING' | 'UNSAVED'>('UNSAVED');
  readonly lastSavedSnapshot = signal<EmailTemplateDTO | undefined>(undefined);
  skipNextAutosave = false;

  readonly paramMapSignal = toSignal(this.route.paramMap, { initialValue: convertToParamMap({}) });
  readonly queryParamMapSignal = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  readonly currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });
  readonly templateId = computed(() => this.paramMapSignal().get('templateId') ?? undefined);
  readonly customizableEmailTypes = signal<EmailTemplateDTOEmailTypeEnum[]>([]);
  readonly alreadyCustomEmailTypes = signal<Set<EmailTemplateDTOEmailTypeEnum>>(new Set());

  readonly preselectedEmailTypeFromQuery = computed<EmailTemplateDTOEmailTypeEnum | undefined>(() => {
    const raw = this.queryParamMapSignal().get('emailType') ?? undefined;
    if (raw === undefined) {
      return undefined;
    }
    return this.customizableEmailTypes().find(v => v === raw);
  });

  readonly formModel = signal<EmailTemplateDTO>({
    emailType: undefined,
    english: { subject: '', body: '' },
    german: { subject: '', body: '' },
  });

  readonly currentSnapshot = computed(() => this.formModel());
  readonly hasUnsavedChanges = computed(() => JSON.stringify(this.currentSnapshot()) !== JSON.stringify(this.lastSavedSnapshot()));
  readonly translationKey = 'researchGroup.emailTemplates';

  readonly templateDisplayName = computed(() => {
    this.currentLang();
    const emailType = this.formModel().emailType;
    if (emailType === undefined) {
      return '';
    }
    return this.translate.instant(`${this.translationKey}.messageType.${emailType}`);
  });

  readonly english = computed(() => this.formModel().english ?? EMPTY_TRANSLATION);
  readonly german = computed(() => this.formModel().german ?? EMPTY_TRANSLATION);

  readonly selectOptions = computed<SelectOption[]>(() => {
    const taken = this.alreadyCustomEmailTypes();
    const currentType = this.formModel().emailType;
    return this.customizableEmailTypes()
      .filter(v => !taken.has(v) || v === currentType)
      .map(v => ({
        name: `researchGroup.emailTemplates.messageType.${v}`,
        value: v,
      }));
  });

  preselectedEmailType = computed(() => this.selectOptions().find(o => o.value === (this.formModel().emailType ?? '')) ?? undefined);

  readonly modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
    ],
    mention: {
      allowedChars: /^[A-Za-z_]*$/,
      mentionDenotationChars: ['$'],
      showDenotationChar: false,
      spaceAfterInsert: false,

      source: (searchTerm: string, renderList: (values: unknown[], searchTerm: string) => void) => {
        const items = this.TEMPLATE_VARIABLES.map(v => ({
          id: v,
          value: this.translate.instant(`researchGroup.emailTemplates.variables.${v}`),
        }));
        const matches = searchTerm.length
          ? items.filter((item): boolean => item.value.toLowerCase().includes(searchTerm.toLowerCase()))
          : items;
        renderList(matches, searchTerm);
      },
    },
  };

  readonly TEMPLATE_VARIABLES = [
    'APPLICANT_FIRST_NAME',
    'APPLICANT_LAST_NAME',
    'APPLICANT_GENDER',
    'USER_FIRST_NAME',
    'USER_LAST_NAME',
    'SUPERVISING_PROFESSOR_FIRST_NAME',
    'SUPERVISING_PROFESSOR_LAST_NAME',
    'SUPERVISING_PROFESSOR_EMAIL',
    'JOB_TITLE',
    'RESEARCH_GROUP_NAME',
    'INTERVIEW_DATE',
    'INTERVIEW_START_TIME',
    'INTERVIEW_END_TIME',
    'INTERVIEW_LOCATION',
    'INTERVIEW_STREAM_LINK',
    'BOOKING_LINK',
    'DOWNLOAD_LINK',
    'EXPORT_EXPIRES_DAYS',
  ];

  readonly templateVariables: SelectOption[] = this.TEMPLATE_VARIABLES.map(v => ({
    name: `researchGroup.emailTemplates.variables.${v}`,
    value: v,
  }));

  readonly loadEffect = effect(() => {
    const templateId = this.templateId();
    if (templateId !== undefined) {
      void this.load(templateId);
      return;
    }
    const preselected = this.preselectedEmailTypeFromQuery();
    if (preselected !== undefined) {
      void this.prefillFromDefault(preselected);
    }
  });

  readonly translateVariablesEffect = effect(() => {
    this.currentLang();
    const form = untracked(() => this.formModel());
    this.skipNextAutosave = true;
    this.formModel.set(this.translateMentionsInTemplate(form));
  });

  readonly formChangeEffect = effect(() => {
    const form = this.formModel();

    if (this.skipNextAutosave) {
      this.skipNextAutosave = false;
      return;
    }
    if (form.emailType === undefined) {
      return;
    }

    const isEmployee = this.accountService.userAuthorities?.includes(UserShortDTORolesEnum.Employee);
    if (isEmployee) {
      return;
    }

    this.savingState.set('SAVING');
    this.clearAutoSaveTimer();

    this.autoSaveTimer = window.setTimeout(() => {
      void this.performAutoSave();
    }, AUTOSAVE_DELAY_MS);
  });

  constructor() {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    void this.loadCustomizableEmailTypes();
  }

  private async loadCustomizableEmailTypes(): Promise<void> {
    try {
      const all = await firstValueFrom(this.emailTemplateApi.getTemplates());
      const types = Array.from(new Set(all.map(t => t.emailType).filter((t): t is EmailTemplateDTOEmailTypeEnum => t !== undefined)));
      const taken = new Set(
        all
          .filter(t => t.isCustom === true)
          .map(t => t.emailType)
          .filter((t): t is EmailTemplateDTOEmailTypeEnum => t !== undefined),
      );
      this.customizableEmailTypes.set(types);
      this.alreadyCustomEmailTypes.set(taken);
    } catch {
      this.toastService.showError({ detail: 'Failed to load email types' });
    }
  }

  readonly beforeUnloadHandler = (): void => {
    if (this.hasUnsavedChanges()) {
      void this.performAutoSave();
    }
  };

  setSelectedEmailType(selection: SelectOption): void {
    const matched = this.customizableEmailTypes().find(v => v === selection.value);
    this.formModel.update(prev => this.withEmailType(prev, matched));
  }

  updateEnglishSubject(subject: string): void {
    this.formModel.update(prev => this.withEnglish(prev, { subject, body: prev.english?.body ?? '' }));
  }

  updateEnglishBody(body: string): void {
    this.formModel.update(prev => this.withEnglish(prev, { subject: prev.english?.subject ?? '', body }));
  }

  updateGermanSubject(subject: string): void {
    this.formModel.update(prev => this.withGerman(prev, { subject, body: prev.german?.body ?? '' }));
  }

  updateGermanBody(body: string): void {
    this.formModel.update(prev => this.withGerman(prev, { subject: prev.german?.subject ?? '', body }));
  }

  private withEmailType(form: EmailTemplateDTO, emailType: EmailTemplateDTOEmailTypeEnum | undefined): EmailTemplateDTO {
    return {
      emailTemplateId: form.emailTemplateId,
      emailType,
      english: form.english,
      german: form.german,
    };
  }

  private withEnglish(form: EmailTemplateDTO, english: EmailTemplateTranslationDTO): EmailTemplateDTO {
    return {
      emailTemplateId: form.emailTemplateId,
      emailType: form.emailType,
      english,
      german: form.german,
    };
  }

  private withGerman(form: EmailTemplateDTO, german: EmailTemplateTranslationDTO): EmailTemplateDTO {
    return {
      emailTemplateId: form.emailTemplateId,
      emailType: form.emailType,
      english: form.english,
      german,
    };
  }

  private translateMentionsInTemplate(form: EmailTemplateDTO): EmailTemplateDTO {
    const updateMentionValues = (html: string): string => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const mentionElements = doc.querySelectorAll('.mention');
      mentionElements.forEach(el => {
        const id = el.getAttribute('data-id');
        if (!id) {
          return;
        }
        const translationKey = `researchGroup.emailTemplates.variables.${id}`;
        const translatedValue = this.translate.instant(translationKey);
        el.setAttribute('data-value', translatedValue);
        const innerSpan = el.querySelector('span[contenteditable="false"]');
        if (innerSpan) {
          innerSpan.innerHTML = `<span class="ql-mention-denotation-char">$</span>${translatedValue}`;
        }
      });

      return doc.body.innerHTML;
    };

    return {
      emailTemplateId: form.emailTemplateId,
      emailType: form.emailType,
      english: {
        subject: form.english?.subject ?? '',
        body: updateMentionValues(form.english?.body ?? ''),
      },
      german: {
        subject: form.german?.subject ?? '',
        body: updateMentionValues(form.german?.body ?? ''),
      },
    };
  }

  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer !== undefined) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  private async performAutoSave(): Promise<void> {
    const form = this.formModel();
    if (form.emailType === undefined) {
      this.savingState.set('SAVED');
      return;
    }

    try {
      if (form.emailTemplateId !== undefined) {
        await firstValueFrom(this.emailTemplateApi.updateTemplate(form));
      } else {
        const created = await firstValueFrom(this.emailTemplateApi.createTemplate(form));
        this.formModel.set({
          emailTemplateId: created.emailTemplateId,
          emailType: form.emailType,
          english: form.english,
          german: form.german,
        });
        this.skipNextAutosave = true;
      }
      this.lastSavedSnapshot.set(this.formModel());
      this.savingState.set('SAVED');
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.toastService.showError({ detail: this.translate.instant(`${this.translationKey}.duplicateError`) });
        this.savingState.set('UNSAVED');
      } else {
        this.toastService.showError({ detail: 'Autosave failed' });
      }
    }
  }

  private async load(templateId: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.emailTemplateApi.getTemplate(templateId));
      const safeTemplate: EmailTemplateDTO = {
        emailTemplateId: res.emailTemplateId,
        emailType: res.emailType,
        english: res.english ?? EMPTY_TRANSLATION,
        german: res.german ?? EMPTY_TRANSLATION,
      };
      const translatedTemplate = this.translateMentionsInTemplate(safeTemplate);
      this.skipNextAutosave = true;
      this.formModel.set(translatedTemplate);
      this.lastSavedSnapshot.set(translatedTemplate);
      this.savingState.set('SAVED');
    } catch {
      this.toastService.showError({ detail: 'Failed to load template' });
    }
  }

  private async prefillFromDefault(emailType: EmailTemplateDTOEmailTypeEnum): Promise<void> {
    try {
      const all = await firstValueFrom(this.emailTemplateApi.getTemplates());
      const match = all.find(t => t.emailType === emailType);
      if (!match) {
        this.toastService.showError({ detail: 'Default template not found' });
        return;
      }
      const prefilled: EmailTemplateDTO = {
        emailType,
        english: match.english ?? EMPTY_TRANSLATION,
        german: match.german ?? EMPTY_TRANSLATION,
      };
      this.skipNextAutosave = true;
      this.formModel.set(this.translateMentionsInTemplate(prefilled));
      this.savingState.set('UNSAVED');
    } catch {
      this.toastService.showError({ detail: 'Failed to load default template' });
    }
  }
}
