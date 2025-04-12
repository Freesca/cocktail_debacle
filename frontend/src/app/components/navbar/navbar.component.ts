import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { AuthService } from '../../services/auth.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoginFormComponent,
    NgIconsModule, // ✅ solo questo
    RegisterFormComponent,
    NgbDropdownModule,
],
  providers: [AuthService],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isAuthenticated = false;
  showDropdown = false;
  showLoginForm = false;
  showRegisterForm = false;

  username = ''; // ← aggiorna dinamicamente da API o localStorage
  userColor = '';
  userInitial = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isAuthenticated = isLoggedIn;
    });
  
    this.authService.userInfo$.subscribe((res) => {
      if (res) {
        this.username = res.username;
        this.userInitial = res.username.charAt(0).toUpperCase();
        this.userColor = this.getColorForUser(res.username);
      }
    });
  
    // Nel caso in cui entri nella pagina già loggato
    this.authService.fetchUserInfoIfLoggedIn();
  }

  toggleLoginForm() {
    this.showLoginForm = !this.showLoginForm;
    this.showRegisterForm = false;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  onLoginSuccess() {
    this.isAuthenticated = true;
    this.authService.fetchUserInfoIfLoggedIn(); // 👈 forza la fetch anche qui
    this.showLoginForm = false;
  }
  

  getColorForUser(name: string): string {
    // Crea un colore hash dal nome per mantenerlo consistente
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`; // Colori vivaci e leggibili
    return color;
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.isAuthenticated = false;  // Imposta lo stato di autenticazione su falso
        this.showDropdown = false;     // Nasconde il dropdown
        console.log('Logout riuscito');
      },
      error: () => {
        console.error('Errore durante il logout');
      }
    });
  }  
}
