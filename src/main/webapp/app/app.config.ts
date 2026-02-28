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
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';
import './config/dayjs';
import { MissingTranslationHandler, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DatePipe } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PublicConfigResourceApiService } from 'app/generated/api/publicConfigResourceApi.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { initializeAppConfig } from 'app/core/config/runtime-config.loader';

import { TUMApplyPreset } from '../content/theming/tumapplypreset';

import { I18N_HASH } from './environments/environment';
import { httpInterceptorProviders } from './core/interceptor';
import routes from './app.routes';
import { NgbDateDayjsAdapter } from './config/datepicker-adapter';
import { AppPageTitleStrategy } from './app-page-title-strategy';
import { missingTranslationHandler } from './config/translation.config';
import { AuthInterceptor } from './core/interceptor/auth.interceptor';
import { ErrorHandlerInterceptor } from './core/interceptor/error-handler.interceptor';
import { NotificationInterceptor } from './core/interceptor/notification.interceptor';
import { AuthFacadeService } from './core/auth/auth-facade.service';
import { PrimengTranslationService } from './shared/language/primeng-translation.service';
import { LoadingInterceptor } from './core/interceptor/loading.interceptor';

/**
 * Application initializer that enforces strict order:
 * 1) Load runtime config
 * 2) Initialize Auth
 */
export async function initializeApp(): Promise<void> {
  const api = inject(PublicConfigResourceApiService);
  const appConfigService = inject(ApplicationConfigService);
  const authFacade = inject(AuthFacadeService);

  await initializeAppConfig(api, appConfigService)();
  await authFacade.initAuth();
}

export function initializePrimeNgI18n(): void {
  inject(PrimengTranslationService);
}

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    provideAppInitializer(initializeApp),
    provideAppInitializer(initializePrimeNgI18n),
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
    importProvidersFrom(RouterModule, ScrollingModule),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: `.json?_=${I18N_HASH}`,
      }),
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useFactory: missingTranslationHandler,
      },
    }),
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
      useClass: LoadingInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NotificationInterceptor,
      multi: true,
    },
  ],
};
