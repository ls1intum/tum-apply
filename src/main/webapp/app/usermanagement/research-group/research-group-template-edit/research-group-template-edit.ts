import { Component, Signal, ViewEncapsulation, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuillEditorComponent } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TabsModule } from 'primeng/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastComponent } from 'app/shared/toast/toast.component';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { EmailTemplateDTO } from '../../../generated';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import 'quill-mention/autoregister';
import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { EmailTemplateResourceService } from '../../../generated/api/emailTemplateResource.service';
import { ToastService } from '../../../service/toast-service';

@Component({
  selector: 'jhi-research-group-template-edit',
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    StringInputComponent,
    TabsModule,
    ToastComponent,
    QuillEditorComponent,
    ButtonComponent,
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
  readonly emailTemplateService = inject(EmailTemplateResourceService);
  readonly translate = inject(TranslateService);
  readonly toastService = inject(ToastService);

  autoSaveTimer: number | undefined;

  // === Autosave + Snapshot Logic ===
  readonly savingState = signal<'SAVED' | 'SAVING' | 'UNSAVED'>('UNSAVED');
  readonly lastSavedSnapshot = signal<EmailTemplateDTO | undefined>(undefined);
  skipNextAutosave = false;

  // === Routing + Translation ===
  readonly paramMapSignal = toSignal(this.route.paramMap, {
    initialValue: convertToParamMap({}),
  });

  readonly currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });
  readonly templateId = computed(() => this.paramMapSignal().get('templateId') ?? undefined);

  // === Form State ===
  readonly formModel = signal<EmailTemplateDTO>({
    templateName: '',
    emailType: undefined,
    english: { subject: '', body: '' },
    german: { subject: '', body: '' },
    isDefault: false,
  });

  readonly currentSnapshot = computed(() => this.formModel());
  readonly hasUnsavedChanges = computed(() => JSON.stringify(this.currentSnapshot()) !== JSON.stringify(this.lastSavedSnapshot()));
  readonly translationKey = 'researchGroup.emailTemplates';

  readonly templateDisplayName = computed(() => {
    this.currentLang(); // Re-evaluate when language changes

    const templateName = this.formModel().templateName;
    const emailType = this.formModel().emailType;

    if (this.formModel().isDefault) {
      // Re-evaluate when language changes
      if (templateName != null) {
        return this.translate.instant(`${this.translationKey}.default.${emailType}-${templateName}`);
      } else {
        return this.translate.instant(`${this.translationKey}.default.${emailType}`);
      }
    }
    return this.formModel().templateName;
  });

  readonly english = computed(() => this.formModel().english ?? { subject: '', body: '' });
  readonly german = computed(() => this.formModel().german ?? { subject: '', body: '' });

  selectOptions: Signal<SelectOption[]> = computed(() =>
    (this.formModel().isDefault ? this.allSelectOptions : this.allowedSelectOptions).map(v => {
      return {
        name: `researchGroup.emailTemplates.messageType.${v}`,
        value: v,
      };
    }),
  );
  preselectedEmailType = computed(() => {
    return this.selectOptions().filter(selectOption => selectOption.value === (this.formModel().emailType ?? ''))[0] ?? undefined;
  });

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

  readonly allowedSelectOptions = ['APPLICATION_ACCEPTED'];

  readonly allSelectOptions = ['APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'APPLICATION_SENT'];

  readonly TEMPLATE_VARIABLES = [
    'APPLICANT_FIRST_NAME',
    'APPLICANT_LAST_NAME',
    'SUPERVISING_PROFESSOR_FIRST_NAME',
    'SUPERVISING_PROFESSOR_LAST_NAME',
    'JOB_TITLE',
    'RESEARCH_GROUP_NAME',
  ];

  // Will be used for a dropdown to insert variables
  readonly templateVariables: SelectOption[] = this.TEMPLATE_VARIABLES.map(v => {
    return {
      name: `researchGroup.emailTemplates.variables.${v}`,
      value: v,
    };
  });

  readonly loadEffect = effect(() => {
    const templateId = this.templateId();
    if (templateId != null) {
      void this.load(templateId);
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

    const isNonDefault = form.isDefault === false;
    const nameMissing = form.templateName?.trim() == null;
    const typeMissing = !form.emailType;

    if (isNonDefault && (nameMissing || typeMissing)) return;

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
      emailType: selection.value as EmailTemplateDTO.EmailTypeEnum,
    }));
  }

  setTemplateName(templateName: string): void {
    this.formModel.update(prev => ({
      ...prev,
      templateName,
    }));
  }

  updateEnglishSubject(subject: string): void {
    this.formModel.update(prev => ({
      ...prev,
      english: {
        ...prev.english,
        subject,
      },
    }));
  }

  updateEnglishBody(body: string): void {
    this.formModel.update(prev => ({
      ...prev,
      english: {
        ...prev.english,
        body,
      },
    }));
  }

  updateGermanSubject(subject: string): void {
    this.formModel.update(prev => ({
      ...prev,
      german: {
        ...prev.german,
        subject,
      },
    }));
  }

  updateGermanBody(body: string): void {
    this.formModel.update(prev => ({
      ...prev,
      german: {
        ...prev.german,
        body,
      },
    }));
  }

  protected navigateBack(): void {
    void this.router.navigate(['/research-group/templates']);
  }

  // Replace mention labels in the Quill HTML with translated versions
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
      english: {
        ...form.english,
        body: updateMentionValues(form.english?.body ?? ''),
      },
      german: {
        ...form.german,
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

  // Persist form changes; distinguishes between create and update; validates required fields
  private async performAutoSave(): Promise<void> {
    const form = this.formModel();

    const isNonDefault = form.isDefault === false;
    const nameMissing = form.templateName?.trim() == null;
    const typeMissing = !form.emailType;

    if (isNonDefault && (nameMissing || typeMissing)) {
      this.savingState.set('SAVED');
      return;
    }

    try {
      if (form.emailTemplateId != null) {
        await firstValueFrom(this.emailTemplateService.updateTemplate(form));
      } else {
        const created = await firstValueFrom(this.emailTemplateService.createTemplate(form));
        this.formModel.set({ ...form, emailTemplateId: created.emailTemplateId });
        this.skipNextAutosave = true;
      }
      this.lastSavedSnapshot.set(this.formModel());

      this.savingState.set('SAVED');
    } catch (error: any) {
      if (error?.status === 409) {
        this.toastService.showError({ detail: 'Template name already exists.' });
        this.savingState.set('UNSAVED');
      } else {
        this.toastService.showError({ detail: 'Autosave failed' });
      }
    }
  }

  // Load and sanitize template data from server
  private async load(templateId: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.emailTemplateService.getTemplate(templateId));
      const safeTemplate: EmailTemplateDTO = {
        ...res,
        english: res.english ?? { subject: '', body: '' },
        german: res.german ?? { subject: '', body: '' },
      };

      const translatedTemplate = this.translateMentionsInTemplate(safeTemplate);
      this.skipNextAutosave = true; // prevent sending update request after loading
      this.formModel.set(translatedTemplate);
      this.lastSavedSnapshot.set(translatedTemplate);
      this.savingState.set('SAVED');
    } catch {
      this.toastService.showError({
        detail: 'Failed to load template',
      });
    }
  }
}
