import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserImageComponent } from '../../components/user-image/user-image.component';
import { AuthService } from '../../services/auth.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';
import { FavouritesService } from '../../services/favourites.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UserImageComponent, NgbNavModule, CocktailsGridComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  username = '';
  email = '';
  oldPassword = '';
  newPassword = '';
  consentData = false;
  consentSuggestions = false;
  editMode = false;
  isAuthenticated = false;
  loading = false;
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  total = 100;
  favorites: any[] = [];
  currentIndex = 0;
  pageSize = 30;
  isLoading = signal(true);

  // Aggiungi questa proprietà per i preferiti
  favourites: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private favouritesService: FavouritesService) {}

  ngOnInit() {
    this.authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isAuthenticated = isLoggedIn;
    });

    this.authService.fetchUserInfoIfLoggedIn();
    this.http.get<any>('/api/user/profile').subscribe({
      next: (res) => {
        this.username = res.userName;
        this.email = res.email;
        this.consentData = res.consentData ?? false;
        this.consentSuggestions = res.consentSuggestions ?? false;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore di caricamento profilo');
        this.isLoading.set(false);
      },
    });

    this.loadFavourites();
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

  loadFavourites() {
    this.loading = true;
    this.favouritesService.getFavourites().subscribe({
      next: (res) => {
        this.favourites = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento dei preferiti', err);
        this.loading = false;
      },
    });
  }

  onToggleFavourite(cocktail: any) {
    if (this.isFavourite(cocktail)) {
      this.removeFavourite(cocktail);
    } else {
      this.addFavourite(cocktail);
    }
  }

  addFavourite(cocktail: any) {
    this.favouritesService.addFavourite(cocktail.idDrink).subscribe({
      next: () => {
        this.loadFavourites(); // Ricarica la lista dei preferiti
      },
      error: (err) => {
        console.error('Errore durante l\'aggiunta ai preferiti', err);
      },
    });
  }

  removeFavourite(cocktail: any) {
    this.favouritesService.removeFavourite(cocktail.idDrink).subscribe({
      next: () => {
        this.loadFavourites(); // Ricarica la lista dei preferiti
      },
      error: (err) => {
        console.error('Errore durante la rimozione dai preferiti', err);
      },
    });
  }

  isFavourite(cocktail: any): boolean {
    return this.favourites.some(fav => fav.idDrink === cocktail.idDrink);
  }
}
