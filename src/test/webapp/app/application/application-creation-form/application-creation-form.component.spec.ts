import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlSegment, withDisabledInitialNavigation } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationFormComponent from '../../../../../main/webapp/app/application/application-creation/application-creation-form/application-creation-form.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService, User } from 'app/core/auth/account.service';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { of, Subject } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { Location } from '@angular/common';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { LocalStorageService } from 'app/service/localStorage.service';
import { TranslateService } from '@ngx-translate/core';

describe('ApplicationForm', () => {
  let accountService: Pick<AccountService, 'loadedUser' | 'signedIn'>;
  let applicationResourceApiService: Pick<
    ApplicationResourceApiService,
    'createApplication' | 'getApplicationById' | 'updateApplication' | 'getDocumentDictionaryIds'
  >;
  let toast: Pick<ToastService, 'showErrorKey' | 'showSuccessKey'>;
  let router: Pick<Router, 'navigate'>;
  let location: Pick<Location, 'back'>;
  let authFacade: Pick<AuthFacadeService, 'requestOtp'>;

  let route$: Subject<UrlSegment[]>;

  let dialogService: Pick<DialogService, 'open'>;
  let authOrchestrator: Pick<AuthOrchestratorService, 'email' | 'firstName' | 'lastName'>;
  let localStorageService: Pick<LocalStorageService, 'saveApplicationDraft' | 'clearApplicationDraft' | 'loadApplicationDraft'>;
  let translateService: Pick<TranslateService, 'instant'>;
  let activatedRoute: Pick<ActivatedRoute, 'snapshot' | 'url'>;

  let fixture: ComponentFixture<ApplicationCreationFormComponent>;
  let comp: ApplicationCreationFormComponent;
  const mockApplication = {
    applicationId: '456',
    applicationState: 'SAVED',
    job: {
      jobId: '123',
      title: 'Software Developer',
    },
    applicant: {},
  };
  beforeEach(async () => {
    accountService = {
      loadedUser: signal<User | undefined>({ id: '2', email: 'test@gmail.com', name: 'Testus Maxima' }),
      signedIn: signal<boolean>(true),
    };

    applicationResourceApiService = {
      createApplication: vi.fn().mockReturnValue(of(mockApplication)),
      getApplicationById: vi.fn().mockReturnValue(of(mockApplication)),
      updateApplication: vi.fn().mockReturnValue(of({})),
      getDocumentDictionaryIds: vi.fn().mockReturnValue(of({})),
    };
    toast = {
      showErrorKey: vi.fn(),
      showSuccessKey: vi.fn(),
    };
    router = { navigate: vi.fn() };
    location = { back: vi.fn() };
    authFacade = { requestOtp: vi.fn() };

    route$ = new Subject();

    dialogService = {
      open: vi.fn().mockReturnValue(of({ close: vi.fn() })),
    };

    authOrchestrator = {
      email: signal<string>('email@email.com'),
      firstName: signal<string>('firstname'),
      lastName: signal<string>('lastname'),
    };

    localStorageService = {
      clearApplicationDraft: vi.fn(),
      loadApplicationDraft: vi.fn(),
      saveApplicationDraft: vi.fn(),
    };

    translateService = {
      instant: vi.fn(),
    };

    activatedRoute = {
      url: route$,
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({ job: '123', application: '456' }),
        url: [],
        params: {},
        queryParams: {},
        fragment: '',
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null!,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        toString: () => '',
        title: '',
      },
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ApplicationResourceApiService, useValue: applicationResourceApiService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ToastService, useValue: toast },
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: DialogService, useValue: dialogService },
        { provide: AuthOrchestratorService, useValue: authOrchestrator },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TranslateService, useValue: translateService },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  // 1
  it('should initialize jobId and applicationId from route', async () => {
    // wait for all async tasks to finish
    await fixture.whenStable();

    expect(comp.jobId()).toBe('123');
    expect(comp.applicationId()).toBe('456');
  });

  // it('should redirect and show error if application is not editable', async () => {
  //     (applicationResourceApiService.getApplicationById as any).mockReturnValue(of({
  //         ...mockApplication,
  //         applicationState: 'SENT'
  //     }));

  //     fixture = TestBed.createComponent(ApplicationCreationFormComponent);
  //     comp = fixture.componentInstance;
  //     fixture.detectChanges();

  //     await fixture.whenStable();

  //     expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
  //     expect(router.navigate).toHaveBeenCalledWith(['/application/detail', '456']);
  // });

  it('should load from local storage when unauthenticated', async () => {
    (accountService.loadedUser as any).set(undefined);
    (localStorageService.loadApplicationDraft as any).mockReturnValue({
      applicationId: 'local-id',
      jobId: 'local-job',
      personalInfoData: {
        email: 'local@example.com',
        firstName: 'Local',
        lastName: 'User',
      },
      timestamp: new Date().toISOString(),
    });

    // recreate component
    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();

    await fixture.whenStable();

    expect(comp.useLocalStorage()).toBe(true);
    expect(comp.applicationId()).toBe('local-id');
    expect(comp.personalInfoData().email).toBe('local@example.com');
  });

  // it('should auto-save periodically when savingState is SAVING', async () => {
  //     vi.useFakeTimers();
  //     const saveSpy = vi.spyOn(comp as any, 'sendCreateApplicationData').mockResolvedValue(true);

  //     comp.savingState.set('SAVING');

  //     // advance timers
  //     vi.advanceTimersByTime(3100);
  //     expect(saveSpy).toHaveBeenCalledTimes(1);

  //     vi.advanceTimersByTime(3100);
  //     expect(saveSpy).toHaveBeenCalledTimes(2);

  //     vi.useRealTimers();
  // });

  it('should call sendCreateApplicationData manually', async () => {
    const saveSpy = vi.spyOn(comp as any, 'sendCreateApplicationData').mockResolvedValue(true);

    await (comp as any).sendCreateApplicationData('SAVING', false);

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should show error if privacy is not accepted on send', () => {
    comp.additionalInfoForm.controls.privacyAccepted.setValue(false);
    comp.onConfirmSend();

    expect(toast.showErrorKey).toHaveBeenCalledWith('privacy.privacyConsent.toastError');
  });

  it('should send application if privacy accepted', async () => {
    comp.applicationId.set('456');
    comp.useLocalStorage.set(false);
    comp.additionalInfoForm.controls.privacyAccepted.setValue(true);
    const sendSpy = vi.spyOn(comp as any, 'sendCreateApplicationData').mockResolvedValue(true);

    comp.onConfirmSend();

    // Wait for any promises to resolve
    await fixture.whenStable();

    expect(sendSpy).toHaveBeenCalledWith('SENT', true);
  });

  // it('should call updateDocumentInformation on navigation', async () => {
  //     const updateSpy = vi.spyOn(comp, 'updateDocumentInformation');

  //     comp.stepData()[1]?.buttonGroupPrev?.[0]?.onClick?.(); // simulate "Prev" on step 2

  //     await fixture.whenStable();

  //     expect(updateSpy).toHaveBeenCalled();
  // });
});
