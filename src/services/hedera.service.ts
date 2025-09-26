import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HederaService {
  private apiUrl = 'http://localhost:3000/hedera'; // Cambia esto si tu backend está en otra URL

  constructor(private http: HttpClient) {}

  getBalance(account: string): Observable<{ balance: string }> {
    return this.http.post<{ balance: string }>(`${this.apiUrl}/balance`, { account });
  }

  transfer(to: string, amount: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/transfer`, { to, amount });
  }
}
