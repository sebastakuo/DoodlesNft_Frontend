import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private apiUrl = 'http://localhost:3000/gemini';

  constructor(private http: HttpClient) {}

  analyzeImage(base64ImageData: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/analyze-image`, { base64ImageData }, { 
      headers
    });
  }

  generateImage(parts: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-image`, { parts });
  }
}