import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { Router, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Component, NgZone, signal } from '@angular/core';
import { of } from 'rxjs';
import { InterpolatableTranslationObject, LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService, User } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import { DialogService } from 'primeng/dynamicdialog';
import { provideHttpClient } from '@angular/common/http';

import MainComponent from './main.component';

jest.mock('app/core/auth/account.service');
jest.mock('app/core/auth/keycloak.service', () => {
  const { MockKeycloakService } = jest.requireActual('app/core/auth/keycloak.service.mock');
  return {
    keycloakService: new MockKeycloakService(),
  };
});

describe('MainComponent', () => {
  let comp: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  let titleService: Title;
  let translateService: TranslateService;
  let mockAccountService: AccountService;
  let ngZone: NgZone;
  const routerState: { snapshot: { root: { data: Record<string, unknown> } } } = { snapshot: { root: { data: {} } } };
  let router: Router;
  let document: Document;

  const navigateByUrlFn = (url: string) => () => router.navigateByUrl(url);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), MainComponent],
      providers: [
        provideHttpClient(),
        Title,
        AccountService,
        { provide: TitleStrategy, useClass: AppPageTitleStrategy },
        {
          provide: DialogService,
          useValue: {
            open: jest.fn(),
            dialogComponentRefMap: new Map(),
          },
        },
      ],
    })
      .overrideTemplate(MainComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    comp = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    translateService = TestBed.inject(TranslateService);
    mockAccountService = TestBed.inject(AccountService);
    mockAccountService.loaded = signal(true);
    mockAccountService.user = signal<User | undefined>(undefined);
    ngZone = TestBed.inject(NgZone);
    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
  });

  describe('page title', () => {
    const defaultPageTitle = 'global.title';
    const parentRoutePageTitle = 'parentTitle';
    const childRoutePageTitle = 'childTitle';
    const langChangeEvent: LangChangeEvent = { lang: 'en', translations: {} as InterpolatableTranslationObject };

    beforeEach(() => {
      routerState.snapshot.root = { data: {} };
      jest.spyOn(translateService, 'get').mockImplementation((key: string | string[]) => of(`${key as string} translated`));
      translateService.currentLang = 'en';
      jest.spyOn(titleService, 'setTitle');
    });

    describe('navigation end', () => {
      it('should set page title to default title if pageTitle is missing on routes', fakeAsync(() => {
        // WHEN
        void ngZone.run(navigateByUrlFn(''));
        tick();

        // THEN
        expect(document.title).toBe(`${defaultPageTitle} translated`);
      }));

      it('should set page title to root route pageTitle if there is no child routes', fakeAsync(() => {
        // GIVEN
        router.resetConfig([{ path: '', title: parentRoutePageTitle, component: BlankComponent }]);

        // WHEN
        void ngZone.run(navigateByUrlFn(''));
        tick();

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);
      }));

      it('should set page title to child route pageTitle if child routes exist and pageTitle is set for child route', fakeAsync(() => {
        // GIVEN
        router.resetConfig([
          {
            path: 'home',
            title: parentRoutePageTitle,
            children: [{ path: '', title: childRoutePageTitle, component: BlankComponent }],
          },
        ]);

        // WHEN
        void ngZone.run(navigateByUrlFn('home'));
        tick();

        // THEN
        expect(document.title).toBe(`${childRoutePageTitle} translated`);
      }));

      it('should set page title to parent route pageTitle if child routes exists but pageTitle is not set for child route data', fakeAsync(() => {
        // GIVEN
        router.resetConfig([
          {
            path: 'home',
            title: parentRoutePageTitle,
            children: [{ path: '', component: BlankComponent }],
          },
        ]);

        // WHEN
        void ngZone.run(navigateByUrlFn('home'));
        tick();

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);
      }));
    });

    describe('language change', () => {
      it('should set page title to default title if pageTitle is missing on routes', () => {
        // WHEN
        translateService.onLangChange.emit(langChangeEvent);

        // THEN
        expect(document.title).toBe(`${defaultPageTitle} translated`);
      });

      it('should set page title to root route pageTitle if there is no child routes', fakeAsync(() => {
        // GIVEN
        routerState.snapshot.root.data = { pageTitle: parentRoutePageTitle };
        router.resetConfig([{ path: '', title: parentRoutePageTitle, component: BlankComponent }]);

        // WHEN
        void ngZone.run(navigateByUrlFn(''));
        tick();

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);

        // GIVEN
        document.title = 'other title';

        // WHEN
        translateService.onLangChange.emit(langChangeEvent);

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);
      }));

      it('should set page title to child route pageTitle if child routes exist and pageTitle is set for child route', fakeAsync(() => {
        // GIVEN
        router.resetConfig([
          {
            path: 'home',
            title: parentRoutePageTitle,
            children: [{ path: '', title: childRoutePageTitle, component: BlankComponent }],
          },
        ]);

        // WHEN
        void ngZone.run(navigateByUrlFn('home'));
        tick();

        // THEN
        expect(document.title).toBe(`${childRoutePageTitle} translated`);

        // GIVEN
        document.title = 'other title';

        // WHEN
        translateService.onLangChange.emit(langChangeEvent);

        // THEN
        expect(document.title).toBe(`${childRoutePageTitle} translated`);
      }));

      it('should set page title to parent route pageTitle if child routes exists but pageTitle is not set for child route data', fakeAsync(() => {
        // GIVEN
        router.resetConfig([
          {
            path: 'home',
            title: parentRoutePageTitle,
            children: [{ path: '', component: BlankComponent }],
          },
        ]);

        // WHEN
        void ngZone.run(navigateByUrlFn('home'));
        tick();

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);

        // GIVEN
        document.title = 'other title';

        // WHEN
        translateService.onLangChange.emit(langChangeEvent);

        // THEN
        expect(document.title).toBe(`${parentRoutePageTitle} translated`);
      }));
    });
  });

  describe('page language attribute', () => {
    it('should change page language attribute on language change', () => {
      // GIVEN

      // WHEN
      translateService.onLangChange.emit({ lang: 'en', translations: {} as InterpolatableTranslationObject });

      // THEN
      expect(document.querySelector('html')?.getAttribute('lang')).toEqual('en');

      // WHEN
      translateService.onLangChange.emit({ lang: 'en', translations: {} as InterpolatableTranslationObject });

      // THEN
      expect(document.querySelector('html')?.getAttribute('lang')).toEqual('en');
    });
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });
});

@Component({
  template: '',
})
export class BlankComponent {}
