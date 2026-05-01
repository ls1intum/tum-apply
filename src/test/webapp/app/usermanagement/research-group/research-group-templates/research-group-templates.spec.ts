import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EmailTemplateOverviewDTO,
  EmailTemplateOverviewDTOEmailTypeEnum,
} from 'app/generated/model/email-template-overview-dto';

import { ResearchGroupTemplates } from '../../../../../../main/webapp/app/usermanagement/research-group/research-group-templates/research-group-templates';
import { EmailTemplateResourceApi } from '../../../../../../main/webapp/app/generated/api/email-template-resource-api';
import { ToastService } from '../../../../../../main/webapp/app/service/toast-service';
import { AccountService } from '../../../../../../main/webapp/app/core/auth/account.service';

class FakeApi {
  getTemplates = vi.fn();
  deleteTemplate = vi.fn();
}

class FakeToast {
  showSuccess = vi.fn();
  showError = vi.fn();
}

class FakeAccount {
  userAuthorities: string[] = [];
}

describe('ResearchGroupTemplates', () => {
  let api: FakeApi;
  let toast: FakeToast;

  beforeEach(() => {
    api = new FakeApi();
    toast = new FakeToast();

    TestBed.configureTestingModule({
      imports: [ResearchGroupTemplates, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: EmailTemplateResourceApi, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: AccountService, useValue: new FakeAccount() },
      ],
    });
  });

  it('renders custom and default rows from a flat list response', async () => {
    const rows: EmailTemplateOverviewDTO[] = [
      {
        emailTemplateId: 'id-1',
        emailType: EmailTemplateOverviewDTOEmailTypeEnum.ApplicationSent,
        isCustom: true,
        firstName: 'A',
        lastName: 'B',
      },
      {
        emailType: EmailTemplateOverviewDTOEmailTypeEnum.ApplicationAccepted,
        isCustom: false,
      },
    ];
    api.getTemplates.mockReturnValue(of(rows));

    const fixture = TestBed.createComponent(ResearchGroupTemplates);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getTemplates).toHaveBeenCalledWith();
    expect((fixture.componentInstance as any)['responseData']()).toHaveLength(2);
  });

  it('shows an error toast when loading fails', async () => {
    api.getTemplates.mockReturnValueOnce(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(ResearchGroupTemplates);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toast.showError).toHaveBeenCalled();
  });

  it('delete reloads the list', async () => {
    api.getTemplates.mockReturnValue(of([]));
    api.deleteTemplate.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(ResearchGroupTemplates);
    fixture.detectChanges();
    await fixture.whenStable();
    api.getTemplates.mockClear();

    await fixture.componentInstance.delete('some-id');

    expect(api.deleteTemplate).toHaveBeenCalledWith('some-id');
    expect(api.getTemplates).toHaveBeenCalled();
  });
});
