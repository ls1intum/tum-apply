import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchGroupTemplates } from 'app/usermanagement/research-group/research-group-templates/research-group-templates';
import { EmailTemplateResourceApi } from 'app/generated/api/email-template-resource-api';
import {
  EmailTemplateOverviewDTO,
  EmailTemplateOverviewDTOEmailTypeEnum,
} from 'app/generated/model/email-template-overview-dto';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideAccountServiceMock } from 'util/account.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { provideRouterMock } from 'util/router.mock';

class FakeApi {
  getTemplates = vi.fn();
  deleteTemplate = vi.fn();
}

describe('ResearchGroupTemplates', () => {
  let api: FakeApi;
  let toast: ToastServiceMock;

  beforeEach(() => {
    api = new FakeApi();
    toast = createToastServiceMock();

    TestBed.configureTestingModule({
      imports: [ResearchGroupTemplates],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideFontAwesomeTesting(),
        provideRouterMock(),
        provideTranslateMock(),
        provideToastServiceMock(toast),
        provideAccountServiceMock(),
        { provide: EmailTemplateResourceApi, useValue: api },
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
    expect(fixture.componentInstance['tableData']()).toHaveLength(2);
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
