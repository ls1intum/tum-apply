import { Component, ViewEncapsulation, computed, effect, inject, model, signal } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuillEditorComponent } from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { TranslateService } from '@ngx-translate/core';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { EmailTemplateDTO, EmailTemplateResourceService } from '../../../generated';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import 'quill-mention/autoregister';
import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';

@Component({
  selector: 'jhi-research-group-template-edit',
  imports: [FormsModule, StringInputComponent, TabsModule, QuillEditorComponent, ButtonComponent, SelectComponent],
  templateUrl: './research-group-template-edit.html',
  styleUrl: './research-group-template-edit.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ResearchGroupTemplateEdit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly emailTemplateService = inject(EmailTemplateResourceService);
  readonly translate = inject(TranslateService);

  readonly paramMapSignal = toSignal(this.route.paramMap, {
    initialValue: convertToParamMap({}),
  });

  readonly currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });

  readonly templateId = computed(() => this.paramMapSignal().get('templateId') ?? undefined);

  readonly loadEffect = effect(() => {
    const templateId = this.templateId();
    if (templateId != null) {
      void this.load(templateId);
    }
  });

  readonly formModel = model<EmailTemplateDTO>({
    templateName: '',
    emailType: undefined,
    english: {
      subject: '',
      body: '',
    },
    german: {
      subject: '',
      body: '',
    },
    isDefault: false,
  });

  readonly translationKey: string = 'researchGroup.emailTemplates';

  readonly templateDisplayName = computed(() => {
    this.currentLang();

    const templateName = this.formModel().templateName;
    const emailType = this.formModel().emailType;

    if (this.formModel().isDefault === true) {
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

  preselectedEmailType = signal<SelectOption | undefined>(undefined);
  selectOptions = computed(() => (this.formModel().isDefault === true ? this.allSelectOptions : this.allowedSelectOptions));

  readonly modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
    ],
    mention: {
      allowedChars: /^[A-Z_]*$/,
      mentionDenotationChars: ['$'],
      showDenotationChar: false,
      spaceAfterInsert: false,
      source: (searchTerm: string, renderList: (values: any[], searchTerm: string) => void) => {
        const items = this.TEMPLATE_VARIABLES.map(v => ({ id: v, value: v }));
        const matches = searchTerm.length ? items.filter(item => item.value.toLowerCase().includes(searchTerm.toLowerCase())) : items;

        renderList(matches, searchTerm);
      },
    },
  };

  readonly allowedSelectOptions: SelectOption[] = [
    {
      name: 'Application accepted',
      value: 'APPLICATION_ACCEPTED',
    },
  ];

  readonly allSelectOptions: SelectOption[] = [
    {
      name: 'Application accepted',
      value: 'APPLICATION_ACCEPTED',
    },
    {
      name: 'Application rejected',
      value: 'APPLICATION_REJECTED',
    },
    {
      name: 'Application Received',
      value: 'APPLICATION_SENT',
    },
  ];

  readonly TEMPLATE_VARIABLES = [
    'APPLICANT_FIRST_NAME',
    'APPLICANT_LAST_NAME',
    'SUPERVISING_PROFESSOR_FIRST_NAME',
    'SUPERVISING_PROFESSOR_LAST_NAME',
    'JOB_TITLE',
    'RESEARCH_GROUP_NAME',
  ];

  saveCurrent(): void {
    this.updateValues();
    if (this.formModel().emailTemplateId != null) {
      void this.update().then(() => this.navigateBack());
    } else {
      void this.create().then(() => this.navigateBack());
    }
  }

  setSelectedEmailType(selection: SelectOption): void {
    const form = this.formModel();
    form.emailType = selection.value as EmailTemplateDTO.EmailTypeEnum;

    this.formModel.set(form);
  }

  setTemplateName(templateName: string): void {
    const form = this.formModel();
    form.templateName = templateName;

    this.formModel.set(form);
  }

  private updateValues(): void {
    const form = this.formModel();

    form.english = {
      subject: this.english().subject,
      body: this.english().body,
    };

    form.german = {
      subject: this.german().subject,
      body: this.german().body,
    };

    this.formModel.set(form);
  }

  private async update(): Promise<void> {
    await firstValueFrom(this.emailTemplateService.updateTemplate(this.formModel()));
  }

  private async create(): Promise<void> {
    await firstValueFrom(this.emailTemplateService.createTemplate(this.formModel()));
  }

  private async load(templateId: string): Promise<void> {
    const res = await firstValueFrom(this.emailTemplateService.getTemplate(templateId));
    const safeTemplate: EmailTemplateDTO = {
      ...res,
      english: res.english ?? { subject: '', body: '' },
      german: res.german ?? { subject: '', body: '' },
    };
    this.preselectedEmailType.set(this.getSelectedEmailTypeSelectOption(res.emailType ?? ''));
    this.formModel.set(safeTemplate);
  }

  private getSelectedEmailTypeSelectOption(emailType: string): SelectOption {
    return this.allSelectOptions.filter(selectOption => selectOption.value === emailType)[0];
  }

  private navigateBack(): void {
    void this.router.navigate(['/research-group/templates']);
  }
}
