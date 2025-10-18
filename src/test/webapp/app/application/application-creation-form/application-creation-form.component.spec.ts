import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, UrlSegment, withDisabledInitialNavigation } from '@angular/router';
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
    let accountService: Pick<AccountService, 'loadedUser'>;
    let applicationResourceApiService: Pick<ApplicationResourceApiService, 'createApplication' | 'getApplicationById' | 'updateApplication' | 'getDocumentDictionaryIds'>;
    let toast: Pick<ToastService, 'showErrorKey' | 'showSuccessKey'>; let router: Pick<Router, 'navigate'>;
    let location: Pick<Location, 'back'>;
    let authFacade: Pick<AuthFacadeService, 'requestOtp'>;

    let route$: Subject<UrlSegment[]>;

    let dialogService: Pick<DialogService, 'open'>;
    let authOrchestrator: Pick<AuthOrchestratorService, 'email' | 'firstName' | 'lastName'>;
    let localStorageService: Pick<LocalStorageService, 'saveApplicationDraft' | 'clearApplicationDraft' | 'loadApplicationDraft'>;
    let translateService: Pick<TranslateService, 'instant'>;

    let fixture: ComponentFixture<ApplicationCreationFormComponent>;
    let comp: ApplicationCreationFormComponent;
    beforeEach(async () => {
        accountService = {
            loadedUser: signal<User | undefined>({ id: '2', email: 'test@gmail.com', name: 'Testus Maxima' })
        };
        applicationResourceApiService = {
            createApplication: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),
            getApplicationById: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),
            updateApplication: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),
            getDocumentDictionaryIds: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),

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
            open: vi.fn().mockReturnValue(of({ close: vi.fn() }))
        };

        authOrchestrator = {
            email: signal<string>('email@email.com'),
            firstName: signal<string>('firstname'),
            lastName: signal<string>('lastname'),
        };

        localStorageService = {
            clearApplicationDraft: vi.fn(),
            loadApplicationDraft: vi.fn(),
            saveApplicationDraft: vi.fn()
        };

        translateService = {
            instant: vi.fn()
        }

        await TestBed.configureTestingModule({
            imports: [ApplicationCreationFormComponent],
            providers: [
                { provide: AccountService, useValue: accountService },
                { provide: ApplicationResourceApiService, useValue: applicationResourceApiService },
                { provide: Router, useValue: router },
                { provide: Location, useValue: location },
                { provide: ToastService, useValue: toast },
                { provide: AuthFacadeService, useValue: authFacade },
                { provide: ActivatedRoute, useValue: { url: route$, snapshot: { paramMap: new Map() } } },
                { provide: DialogService, useValue: dialogService },
                { provide: AuthOrchestratorService, useValue: authOrchestrator },
                { provide: LocalStorageService, useValue: localStorageService },
                { provide: TranslateService, useValue: translateService },
                provideRouter([], withDisabledInitialNavigation()),
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
});