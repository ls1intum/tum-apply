import { firstValueFrom } from 'rxjs';
import { PublicConfigResourceApi } from 'app/generated/api/public-config-resource-api';
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
export function initializeAppConfig(api: PublicConfigResourceApi, service: ApplicationConfigService): () => Promise<void> {
  return async () => {
    const response = await firstValueFrom(api.config());
    service.setAppConfig(response as ApplicationConfig);
  };
}
