import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailTemplateDTOEmailTypeEnum } from 'app/generated/model/email-template-dto';

import { ResearchGroupTemplateEdit } from '../../../../../../main/webapp/app/usermanagement/research-group/research-group-template-edit/research-group-template-edit';
import { EmailTemplateResourceApi } from '../../../../../../main/webapp/app/generated/api/email-template-resource-api';
import { ToastService } from '../../../../../../main/webapp/app/service/toast-service';
import { AccountService } from '../../../../../../main/webapp/app/core/auth/account.service';

class FakeApi {
  getTemplate = vi.fn();
  getTemplates = vi.fn();
  createTemplate = vi.fn();
  updateTemplate = vi.fn();
}

class FakeToast {
  showSuccess = vi.fn();
  showError = vi.fn();
}

class FakeAccount {
  userAuthorities: string[] = [];
}

describe('ResearchGroupTemplateEdit', () => {
  let api: FakeApi;

  beforeEach(() => {
    api = new FakeApi();
    api.getTemplate.mockReturnValue(of({}));
    api.getTemplates.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ResearchGroupTemplateEdit, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: EmailTemplateResourceApi, useValue: api },
        { provide: ToastService, useValue: new FakeToast() },
        { provide: AccountService, useValue: new FakeAccount() },
      ],
    });
  });

  it('initialises with empty form model', () => {
    const fixture = TestBed.createComponent(ResearchGroupTemplateEdit);
    fixture.detectChanges();

    const form = fixture.componentInstance.formModel();
    expect(form.emailType).toBeUndefined();
    expect(form.english?.subject).toBe('');
    expect(form.german?.subject).toBe('');
  });

  it('updates emailType via setSelectedEmailType', () => {
    const fixture = TestBed.createComponent(ResearchGroupTemplateEdit);
    fixture.detectChanges();

    fixture.componentInstance.setSelectedEmailType({ name: 'X', value: EmailTemplateDTOEmailTypeEnum.ApplicationSent });

    expect(fixture.componentInstance.formModel().emailType).toBe(EmailTemplateDTOEmailTypeEnum.ApplicationSent);
  });

  it('updates english subject via updateEnglishSubject', () => {
    const fixture = TestBed.createComponent(ResearchGroupTemplateEdit);
    fixture.detectChanges();

    fixture.componentInstance.updateEnglishSubject('Hello');

    expect(fixture.componentInstance.formModel().english?.subject).toBe('Hello');
  });
});
