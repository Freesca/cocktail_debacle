import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { AuthService } from '../../services/auth.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UserImageComponent } from '../user-image/user-image.component'; // Aggiungi il percorso corretto



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
    UserImageComponent // Aggiungi il componente UserImage
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

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isAuthenticated = isLoggedIn;
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
