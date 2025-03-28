import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './_services/auth.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  formType: 'login' | 'register' = 'login';
  isFormOpen = false;
  
  usernameOrEmail = '';
  username = '';
  email = '';
  password = '';

  constructor(private authService: AuthService) {}

  toggleForm(type: 'login' | 'register') {
    this.formType = type;
    this.isFormOpen = !this.isFormOpen;
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:5000/auth/google-login';
  }

  onSubmit() {
    if (this.formType === 'login') {
      this.authService.login(this.usernameOrEmail, this.password).subscribe({
        next: (res) => console.log('✅ Login OK', res),
        error: (err) => console.error('❌ Login error', err)
      });
    } else {
      this.authService.register(this.username, this.email, this.password).subscribe({
        next: (res) => console.log('✅ Register OK', res),
        error: (err) => console.error('❌ Register error', err)
      });
    }
  }
}