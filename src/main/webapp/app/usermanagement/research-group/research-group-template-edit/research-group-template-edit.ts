import { Component, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { SelectComponent } from '../../../shared/components/atoms/select/select.component';
import { EditorComponent } from '../../../shared/components/atoms/editor/editor.component';
import { EmailTemplateDTO, EmailTemplateResourceService } from '../../../generated';

@Component({
  selector: 'jhi-research-group-template-edit',
  imports: [StringInputComponent, SelectComponent, EditorComponent],
  templateUrl: './research-group-template-edit.html',
  styleUrl: './research-group-template-edit.scss',
})
export class ResearchGroupTemplateEdit {
  templateId = input<string | undefined>(undefined);

  protected readonly emailTemplateService = inject(EmailTemplateResourceService);

  protected readonly formModel = signal<EmailTemplateDTO>({
    templateName: '',
    emailType: undefined!,
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

  constructor() {
    effect(() => {
      const templateId = this.templateId();
      if (templateId != null) {
        void this.load(templateId);
      }
    });
  }

  private async load(templateId: string): Promise<void> {
    const res = await firstValueFrom(this.emailTemplateService.getTemplate(templateId));
    this.formModel.set(res);
  }
}
