import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminExportType } from './admin-export.model';

/**
 * Thin wrapper over the AdminExportResource backend endpoint. Hand-rolled
 * (rather than generated) until the OpenAPI codegen is next regenerated.
 */
@Injectable({ providedIn: 'root' })
export class AdminExportService {
  private readonly http = inject(HttpClient);
  private readonly basePath = '/api/admin/exports';

  /**
   * Triggers an admin export for the given type. The backend builds the ZIP
   * synchronously and returns it as a binary attachment; resolve the returned
   * Observable to a {@link Blob} response and trigger a browser download.
   */
  download(type: AdminExportType): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.basePath}/${type}`, null, {
      observe: 'response',
      responseType: 'blob',
    });
  }
}
