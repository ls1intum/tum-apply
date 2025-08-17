import {
  ApplicationConfig,
  LOCALE_ID,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { RouterModule, TitleStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import './config/dayjs';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DatePipe } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { TUMApplyPreset } from '../content/theming/tumapplypreset';

import { ApiModule, Configuration } from './generated';
import { httpInterceptorProviders } from './core/interceptor';
import routes from './app.routes';
import { NgbDateDayjsAdapter } from './config/datepicker-adapter';
import { AppPageTitleStrategy } from './app-page-title-strategy';
import { missingTranslationHandler, translatePartialLoader } from './config/translation.config';
import { AuthInterceptor } from './core/interceptor/auth.interceptor';
import { ErrorHandlerInterceptor } from './core/interceptor/error-handler.interceptor';
import { NotificationInterceptor } from './core/interceptor/notification.interceptor';
import { AuthFacadeService } from './core/auth/auth-facade.service';

/**
 * Application initializer that tries email-session-refresh first,
 * then falls back to Keycloak SSO init via AuthFacadeService.
 */
export async function initializeAuth(): Promise<void> {
  const authFacade = inject(AuthFacadeService);
  await authFacade.initAuth();
}

export function apiConfigFactory(): Configuration {
  return new Configuration({
    withCredentials: true,
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    provideAppInitializer(initializeAuth),
    provideZonelessChangeDetection(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: TUMApplyPreset,
        options: {
          darkModeSelector: '.tum-apply-dark-mode',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
    }),
    importProvidersFrom(BrowserModule),
    // Set this to true to enable service worker (PWA)
    importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })),
    importProvidersFrom(
      ApiModule.forRoot(apiConfigFactory),
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
    Title,
    { provide: LOCALE_ID, useValue: 'en' },
    { provide: NgbDateAdapter, useClass: NgbDateDayjsAdapter },
    httpInterceptorProviders,
    { provide: TitleStrategy, useClass: AppPageTitleStrategy },
    DatePipe,
    DialogService,
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
      useClass: AuthInterceptor,
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
