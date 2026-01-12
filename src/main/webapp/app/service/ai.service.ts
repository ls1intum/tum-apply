import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {JobFormDTO} from "app/generated";

export interface AiResponseDTO {
  jobDescription: string;
}

@Injectable({providedIn: 'root'})
export class AiService {
  private baseUrl = 'api/ai';

  constructor(private http: HttpClient) {}

  generateJobApplicationDraft(request: JobFormDTO): Observable<AiResponseDTO> {
    return this.http.post<AiResponseDTO>(`${this.baseUrl}/generate`, request);
  }
}
