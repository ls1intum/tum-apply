import { environment } from 'app/environments/environment.override';
import { firstValueFrom } from 'rxjs';
import { PublicConfigResourceApiService } from 'app/generated/api/publicConfigResourceApi.service';

type Indexable = Record<string, unknown>;

// Type guard for plain objects (no arrays, no null)
function isPlainObject(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merges values from `source` into `target`, but only for keys that already exist in `target`.
 * Unknown keys in `source` are ignored to avoid accidental schema expansion or prototype pollution.
 */
function mergeExistingKeys(target: Indexable, source: unknown): void {
  if (!isPlainObject(source)) return;

  for (const [key, sourceValue] of Object.entries(source)) {
    if (!(key in target)) continue; // ignore unknown keys

    const targetValue = target[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      mergeExistingKeys(targetValue, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  }
}

export function loadRuntimeConfig(api: PublicConfigResourceApiService): () => Promise<void> {
  return () =>
    firstValueFrom(api.config())
      .then(configuration => {
        mergeExistingKeys(environment, configuration);
      })
      .catch(() => void 0);
}
