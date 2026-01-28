import { Injectable, inject } from '@angular/core';
import { KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';

/**
 * Service for streaming AI responses using Server-Sent Events (SSE).
 * This service provides real-time streaming capabilities that the generated
 * AiResourceApiService cannot provide due to HttpClient limitations.
 */
@Injectable({
  providedIn: 'root',
})
export class AiStreamingService {
  private keycloakService = inject(KeycloakAuthenticationService);
  // TODO: Check if streaming can be implemented in the generated AiResourceApiService and remove this service if so.
  /**
   * Generates a job application draft using streaming SSE.
   * Calls the provided callback for each chunk received, allowing real-time UI updates.
   *
   * @param lang The language for the generated job description ('en' or 'de')
   * @param jobFormDTO The job form data used to build the AI prompt
   * @param onChunk Callback function called for each content chunk received
   * @returns Promise that resolves with the full accumulated content, or rejects on error
   */
  async generateJobApplicationDraftStream(
    lang: string,
    jobFormDTO: JobFormDTO,
    onChunk: (accumulatedContent: string) => void,
  ): Promise<string> {
    // Build URL with query parameters
    let url = `/api/ai/generateJobApplicationDraftStream?lang=${encodeURIComponent(lang)}`;

    // Get auth token from Keycloak
    const token = this.keycloakService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    // Add Authorization header if token exists
    if (token?.length) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use fetch API for streaming SSE (HttpClient doesn't support true streaming)
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(jobFormDTO),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return '';
    }

    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let lineBuffer = ''; // Buffer for incomplete lines across chunk boundaries
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;

      if (result.value) {
        // Decode the chunk and prepend any buffered incomplete line from the previous read
        const chunk = lineBuffer + decoder.decode(result.value, { stream: true });

        // Split by newlines, but the last element might be incomplete
        const lines = chunk.split('\n');

        // The last element is either empty (if chunk ended with \n) or an incomplete line
        // Store it in the buffer for the next iteration
        lineBuffer = lines.pop() ?? '';

        // Process all complete lines
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const content = line.slice(5); // Remove "data:" prefix
            accumulatedContent += content;
            // Call the callback with accumulated content for real-time updates
            onChunk(accumulatedContent);
          }
          // Ignore empty lines and other SSE fields (event:, id:, retry:)
        }
      }
    }

    // Process any remaining buffered content after stream ends
    if (lineBuffer.startsWith('data:')) {
      const content = lineBuffer.slice(5);
      accumulatedContent += content;
      onChunk(accumulatedContent);
    }

    return accumulatedContent;
  }
}
