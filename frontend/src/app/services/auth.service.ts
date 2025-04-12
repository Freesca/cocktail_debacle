import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';


export interface UserInfo {
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth'; // Cambia se usi reverse proxy o domini
  private userInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  userInfo$ = this.userInfoSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(usernameOrEmail: string, password: string) {
    return this.http.post(`${this.apiUrl}/login`, { usernameOrEmail, password }, {
      withCredentials: true
    }).pipe(
      map(() => {
        this.fetchUserInfoIfLoggedIn(); // 👈 Fetch subito dopo login
        return true;
      }),
      catchError(() => of(false))
    );
  }
  

  register(username: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  isLoggedIn(): Observable<boolean> {
    console.log('Checking if user is logged in...');
    return this.http.get<{ message: string }>(`${this.apiUrl}/is-logged-in`, {
      withCredentials: true
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>('/api/auth/me', {
      withCredentials: true
    });
  }


  fetchUserInfoIfLoggedIn() {
    this.getUserInfo().subscribe({
      next: (res) => this.userInfoSubject.next(res),
      error: () => this.userInfoSubject.next(null)
    });
  }

  setUserInfo(userInfo: UserInfo | null) {
    this.userInfoSubject.next(userInfo);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }
}