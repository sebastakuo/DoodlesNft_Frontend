import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserLogin } from '../../models/user/userLogin.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'auth_token';

  private sesionActivaSubject = new BehaviorSubject<boolean>(this.hasSession());
  readonly sesionActiva$ = this.sesionActivaSubject.asObservable();

  private roleSubject = new BehaviorSubject<number | null>(this.getCurrentRole());
  readonly role$ = this.roleSubject.asObservable();

  saveSession(userLogin: UserLogin) {
    const session = { userLogin };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    this.sesionActivaSubject.next(true);
    this.roleSubject.next(userLogin.RoleId);
  }

  getSession() {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  hasSession(): boolean {
    return !!sessionStorage.getItem(this.STORAGE_KEY);
  }

   private getCurrentRole(): number | null {
    const session = this.getSession();
    return session ? session.userLogin.RoleId : null;
  }

  closeSession() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.sesionActivaSubject.next(false);
  }
}
