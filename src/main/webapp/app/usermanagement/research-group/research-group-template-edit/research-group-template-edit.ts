import { Component, ViewEncapsulation, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { CommonModule } from '@angular/common';
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
import {
  EmailTemplateDTO,
  EmailTemplateDTOEmailTypeEnum,
  EmailTemplateDTOEmailTypeEnumValues,
} from 'app/generated/model/email-template-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';

import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { EmailTemplateResourceApi } from '../../../generated/api/email-template-resource-api';
import { AccountService } from '../../../core/auth/account.service';

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
  readonly preselectedEmailTypeFromQuery = computed(
    () => (this.queryParamMapSignal().get('emailType') as EmailTemplateDTOEmailTypeEnum | null) ?? undefined,
  );

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
    if (emailType == null) {
      return '';
    }
    return this.translate.instant(`${this.translationKey}.messageType.${emailType}`);
  });

  readonly english = computed(() => this.formModel().english ?? { subject: '', body: '' });
  readonly german = computed(() => this.formModel().german ?? { subject: '', body: '' });

  readonly selectOptions = computed<SelectOption[]>(() =>
    EmailTemplateDTOEmailTypeEnumValues.map(v => ({
      name: `researchGroup.emailTemplates.messageType.${v}`,
      value: v,
    })),
  );

  preselectedEmailType = computed(
    () => this.selectOptions().find(o => o.value === (this.formModel().emailType ?? '')) ?? undefined,
  );

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

      source: (searchTerm: string, renderList: (values: any[], searchTerm: string) => void) => {
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
    if (templateId != null) {
      void this.load(templateId);
    } else {
      const preselected = this.preselectedEmailTypeFromQuery();
      if (preselected != null) {
        void this.prefillFromDefault(preselected);
      }
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
    if (!form.emailType) return;

    const isEmployee = this.accountService.userAuthorities?.includes(UserShortDTORolesEnum.Employee);
    if (isEmployee) return;

    this.savingState.set('SAVING');
    this.clearAutoSaveTimer();

    this.autoSaveTimer = window.setTimeout(() => {
      void this.performAutoSave();
    }, 3000);
  });

  constructor() {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  readonly beforeUnloadHandler = (): void => {
    if (this.hasUnsavedChanges()) {
      void this.performAutoSave();
    }
  };

  setSelectedEmailType(selection: SelectOption): void {
    this.formModel.update(prev => ({
      ...prev,
      emailType: selection.value as EmailTemplateDTOEmailTypeEnum,
    }));
  }

  updateEnglishSubject(subject: string): void {
    this.formModel.update(prev => ({ ...prev, english: { ...prev.english, subject } }));
  }

  updateEnglishBody(body: string): void {
    this.formModel.update(prev => ({ ...prev, english: { ...prev.english, body } }));
  }

  updateGermanSubject(subject: string): void {
    this.formModel.update(prev => ({ ...prev, german: { ...prev.german, subject } }));
  }

  updateGermanBody(body: string): void {
    this.formModel.update(prev => ({ ...prev, german: { ...prev.german, body } }));
  }

  private translateMentionsInTemplate(form: EmailTemplateDTO): EmailTemplateDTO {
    const updateMentionValues = (html: string): string => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const mentionElements = doc.querySelectorAll('.mention');
      mentionElements.forEach(el => {
        const id = el.getAttribute('data-id');
        if (!id) return;
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
      ...form,
      english: { ...form.english, body: updateMentionValues(form.english?.body ?? '') },
      german: { ...form.german, body: updateMentionValues(form.german?.body ?? '') },
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
    if (!form.emailType) {
      this.savingState.set('SAVED');
      return;
    }

    try {
      if (form.emailTemplateId != null) {
        await firstValueFrom(this.emailTemplateApi.updateTemplate(form));
      } else {
        const created = await firstValueFrom(this.emailTemplateApi.createTemplate(form));
        this.formModel.set({ ...form, emailTemplateId: created.emailTemplateId });
        this.skipNextAutosave = true;
      }
      this.lastSavedSnapshot.set(this.formModel());
      this.savingState.set('SAVED');
    } catch (error: any) {
      if (error?.status === 409) {
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
        ...res,
        english: res.english ?? { subject: '', body: '' },
        german: res.german ?? { subject: '', body: '' },
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
        english: match.english ?? { subject: '', body: '' },
        german: match.german ?? { subject: '', body: '' },
      };
      this.skipNextAutosave = true;
      this.formModel.set(this.translateMentionsInTemplate(prefilled));
      this.savingState.set('UNSAVED');
    } catch {
      this.toastService.showError({ detail: 'Failed to load default template' });
    }
  }
}
