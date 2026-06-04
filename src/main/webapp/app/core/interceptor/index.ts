import { HttpInterceptorFn } from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';
import { errorHandlerInterceptor } from './error-handler.interceptor';
import { notificationInterceptor } from './notification.interceptor';

export const httpInterceptors: HttpInterceptorFn[] = [authInterceptor, errorHandlerInterceptor, notificationInterceptor];
