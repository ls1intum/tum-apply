import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchGroupTemplateEdit } from 'app/usermanagement/research-group/research-group-template-edit/research-group-template-edit';
import { EmailTemplateResourceApi } from 'app/generated/api/email-template-resource-api';
import { EmailTemplateDTOEmailTypeEnum } from 'app/generated/model/email-template-dto';
import { provideToastServiceMock } from 'util/toast-service.mock';
import { provideAccountServiceMock } from 'util/account.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { provideRouterMock } from 'util/router.mock';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';

class FakeApi {
  getTemplate = vi.fn();
  getTemplates = vi.fn();
  createTemplate = vi.fn();
  updateTemplate = vi.fn();
}

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('ResearchGroupTemplateEdit', () => {
  let api: FakeApi;

  beforeEach(() => {
    global.ResizeObserver = ResizeObserverMock;

    api = new FakeApi();
    api.getTemplate.mockReturnValue(of({}));
    api.getTemplates.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ResearchGroupTemplateEdit],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideFontAwesomeTesting(),
        provideRouterMock(),
        provideActivatedRouteMock(createActivatedRouteMock()),
        provideTranslateMock(),
        provideToastServiceMock(),
        provideAccountServiceMock(),
        { provide: EmailTemplateResourceApi, useValue: api },
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
