import { firstValueFrom } from 'rxjs';
import { PublicConfigResourceApiService } from 'app/generated/api/publicConfigResourceApi.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

import { ApplicationConfig } from './application-config.model';

/**
 * Function to initialize the application configuration by fetching it from the API.
 * This function returns a promise that resolves when the configuration is set.
 *
 * @param api - The service used to fetch the public configuration.
 * @param service - The service used to set the application configuration.
 * @returns A function that returns a promise resolving to void.
 */
export function initializeAppConfig(api: PublicConfigResourceApiService, service: ApplicationConfigService): () => Promise<void> {
  return async () => {
    const response = await firstValueFrom(api.config());
    service.setAppConfig(response as ApplicationConfig);
  };
}
