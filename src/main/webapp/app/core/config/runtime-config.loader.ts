import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

import { ApplicationConfig } from './application-config.model';

/**
 * Function to initialize the application configuration by fetching it from the API.
 * This function returns a promise that resolves when the configuration is set.
 *
 * @param http - The HttpClient used to fetch the public configuration.
 * @param service - The service used to set the application configuration.
 * @returns A function that returns a promise resolving to void.
 */
export function initializeAppConfig(http: HttpClient, service: ApplicationConfigService): () => Promise<void> {
  return async () => {
    const response = await firstValueFrom(http.get<Record<string, unknown>>('/api/public/config'));
    service.setAppConfig(response as ApplicationConfig);
  };
}
