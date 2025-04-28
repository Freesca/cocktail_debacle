import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Assicurati che il percorso sia corretto

@Component({
  selector: 'app-register-form',
  imports: [CommonModule, NgIconsModule, FormsModule],
  providers: [AuthService],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent {
  username = '';
  email = '';
  password = '';

  acceptedTerms = false;
  acceptedPrivacy = false;

  @Output() registerSuccess = new EventEmitter<boolean>();
  @Output() closeForm = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (this.acceptedTerms && this.acceptedPrivacy) {
      this.authService.register(this.username, this.email, this.password).subscribe({
        next: () => {
          console.log('Registrazione completata con successo');
          
          // Dopo la registrazione, possiamo fare il login automatico
          this.authService.login(this.username, this.password).subscribe({
            next: () => {
              console.log('Login avvenuto con successo dopo la registrazione');
              this.authService.fetchUserInfoIfLoggedIn();
              this.registerSuccess.emit();
              this.closeForm.emit(); // Chiude il form
            },
            error: (err) => {
              console.error('Errore nel login dopo la registrazione:', err);
              // Gestisci errori di login se necessario
            }
          });
        },
        error: (err) => {
          console.error('Errore nella registrazione:', err);
          // Qui puoi gestire messaggi di errore o alert
        }
      });
    }
  }  

  closeRegister() {
    this.closeForm.emit();
  }

  switchToLoginForm() {
    this.switchToLogin.emit();
  }
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
