import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  username = '';
  email = '';
  oldPassword = '';
  newPassword = '';

  consentData = false;
  consentSuggestions = false;
  editMode = false;

  loading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('/api/user/profile').subscribe({
      next: (res) => {
        this.username = res.userName;
        this.email = res.email;
        this.consentData = res.consentData ?? false;
        this.consentSuggestions = res.consentSuggestions ?? false;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore di caricamento profilo');
        this.loading.set(false);
      },
    });
  }

  enableEdit() {
    this.editMode = true;
  }

  updateProfile() {
    const body = {
      username: this.username,
      email: this.email,
      oldPassword: this.oldPassword || null,
      newPassword: this.newPassword || null,
      consentData: this.consentData,
      consentSuggestions: this.consentSuggestions,
    };

    this.http.patch('/api/user/profile', body).subscribe({
      next: () => {
        this.successMessage.set('Profilo aggiornato con successo!');
        this.editMode = false;
        this.oldPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore durante l\'aggiornamento');
      },
    });
  }

  deleteAccount() {
    if (!confirm('Sei sicuro di voler eliminare il tuo account?')) return;

    this.http.delete('/api/user/profile').subscribe({
      next: () => {
        this.successMessage.set('Account eliminato con successo!');
        // Redireziona o mostra messaggio
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore durante la cancellazione');
      },
    });
  }
}
