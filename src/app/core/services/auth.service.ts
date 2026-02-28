import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface User {
  id: string;
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'app_token';

  constructor() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }

  login(username: string, password: string): Observable<User> {
    // Mock login logic
    const mockUser: User = {
      id: '1',
      username,
      roles: ['ADMIN']
    };
    return of(mockUser).pipe(
      delay(500),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem(this.tokenKey, 'mock-jwt-token-736294');
        this.currentUserSubject.next(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
