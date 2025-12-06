import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthCardComponent } from 'app/shared/components/templates/auth-card/auth-card.component';
import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from '../../../../../util/auth-orchestrator.service.mock';
import { createHttpClientMock, HttpClientMock, provideHttpClientMock } from '../../../../../util/http-client.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../../../util/toast-service.mock';
import { provideTranslateMock } from '../../../../../util/translate.mock';
import {
  ApplicationConfigServiceMock,
  createApplicationConfigServiceMock,
  provideApplicationConfigServiceMock,
} from '../../../../../util/application-config.service.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';

describe('AuthCardComponent', () => {
  let fixture: ComponentFixture<AuthCardComponent>;
  let component: AuthCardComponent;

  let authOrchestrator: AuthOrchestratorServiceMock;
  let applicationConfigService: ApplicationConfigServiceMock;
  let toastService: ToastServiceMock;
  let httpClientService: HttpClientMock;

  beforeEach(async () => {
    authOrchestrator = createAuthOrchestratorServiceMock();
    applicationConfigService = createApplicationConfigServiceMock();
    toastService = createToastServiceMock();
    httpClientService = createHttpClientMock();

    TestBed.configureTestingModule({
      imports: [AuthCardComponent],
      providers: [
        provideAuthOrchestratorServiceMock(authOrchestrator),
        provideApplicationConfigServiceMock(applicationConfigService),
        provideToastServiceMock(toastService),
        provideHttpClientMock(httpClientService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    });

    fixture = TestBed.createComponent(AuthCardComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onClose should call authOrchestrator.close', () => {
    component.onClose();
    expect(authOrchestrator.close).toHaveBeenCalledOnce();
  });

  it('should display login component when mode is "login"', () => {
    authOrchestrator.mode.set('login');
    fixture.detectChanges();

    const loginElement = fixture.nativeElement.querySelector('jhi-login');
    const registrationElement = fixture.nativeElement.querySelector('jhi-registration');

    expect(loginElement).toBeTruthy();
    expect(registrationElement).toBeFalsy();
  });

  it('should display registration component when mode is "register"', () => {
    authOrchestrator.mode.set('register');
    fixture.detectChanges();

    const loginElement = fixture.nativeElement.querySelector('jhi-login');
    const registrationElement = fixture.nativeElement.querySelector('jhi-registration');

    expect(loginElement).toBeFalsy();
    expect(registrationElement).toBeTruthy();
  });
});
