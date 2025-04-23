import { ApplicationConfig, LOCALE_ID, importProvidersFrom, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { RouterModule, TitleStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import './config/dayjs';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideNgxWebstorage, withLocalStorage, withNgxWebstorageConfig, withSessionStorage } from 'ngx-webstorage';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DatePipe } from '@angular/common';

import { httpInterceptorProviders } from './core/interceptor';
import routes from './app.routes';
import { NgbDateDayjsAdapter } from './config/datepicker-adapter';
import { AppPageTitleStrategy } from './app-page-title-strategy';
import { missingTranslationHandler, translatePartialLoader } from './config/translation.config';
import { AuthExpiredInterceptor } from './core/interceptor/auth-expired.interceptor';
import { ErrorHandlerInterceptor } from './core/interceptor/error-handler.interceptor';
import { NotificationInterceptor } from './core/interceptor/notification.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    importProvidersFrom(BrowserModule),
    // Set this to true to enable service worker (PWA)
    importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })),
    importProvidersFrom(
      RouterModule,
      ScrollingModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: translatePartialLoader,
          deps: [HttpClient],
        },
        missingTranslationHandler: {
          provide: MissingTranslationHandler,
          useFactory: missingTranslationHandler,
        },
      }),
    ),
    provideHttpClient(withInterceptorsFromDi()),
    provideNgxWebstorage(
      withNgxWebstorageConfig({
        prefix: 'jhi',
        separator: '-',
      }),
      withLocalStorage(),
      withSessionStorage(),
    ),
    Title,
    { provide: LOCALE_ID, useValue: 'en' },
    { provide: NgbDateAdapter, useClass: NgbDateDayjsAdapter },
    httpInterceptorProviders,
    { provide: TitleStrategy, useClass: AppPageTitleStrategy },
    DatePipe,
    /**
     * @description Interceptor declarations:
     * Interceptors are located at 'blocks/interceptor/.
     * All of them implement the HttpInterceptor interface.
     * They can be used to modify API calls or trigger additional function calls.
     * Most interceptors will transform the outgoing request before passing it to
     * the next interceptor in the chain, by calling next.handle(transformedReq).
     * Documentation: https://angular.io/api/common/http/HttpInterceptor
     */
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthExpiredInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NotificationInterceptor,
      multi: true,
    },
  ],
};
