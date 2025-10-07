import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timeout, retry } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private apiUrl = 'http://localhost:3000/gemini'; // Cambia esto si tu backend está en otra URL

  constructor(private http: HttpClient) {}

  analyzeImage(base64ImageData: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/analyze-image`, { base64ImageData }, { 
      headers,
      // Timeout de 45 segundos para el request HTTP
      timeout: 45000 
    }).pipe(
      // Reintentar una vez si falla
      retry(1),
      // Timeout adicional de RxJS (50 segundos total)
      timeout(50000)
    );
  }

  generateImage(parts: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-image`, { parts });
  }

  generateImageFromText(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-image-from-text`, { prompt });
  }
}