import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserImageComponent } from '../../components/user-image/user-image.component';
import { AuthService } from '../../services/auth.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';

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
  activeId = 2; // Per il tab attivo

  
  // Profile visibility controls
  isOwnProfile = false;
  profileUsername = '';
  loggedInUsername = '';

  // Aggiungi questa proprietà per i preferiti
  favourites: any[] = [];

  constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private favouritesService: FavouritesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the username from the route
    this.route.paramMap.subscribe(params => {
      const usernameParam = params.get('username');
      if (usernameParam) {
        this.profileUsername = usernameParam;
        this.loadProfileData();
      }
    });

    // Check if user is logged in
    this.authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isAuthenticated = isLoggedIn;
      
      if (isLoggedIn) {
        // Get current user info to determine if this is the user's own profile
        this.authService.userInfo$.subscribe(user => {
          if (user) {
            this.loggedInUsername = user.username;
            this.isOwnProfile = (this.loggedInUsername === this.profileUsername);
            
            // Only load detailed info if it's the user's own profile
            if (this.isOwnProfile) {
              this.loadOwnProfileDetails();
            }
          }
        });
        
        this.authService.fetchUserInfoIfLoggedIn();
      }
    });

    // Always load favourites (public info)
    this.loadFavourites();
  }

  loadProfileData() {
    // Basic profile data load (works for any user)
    this.isLoading.set(true);
    
    // For the profile page, we only need the username for a public profile
    this.username = this.profileUsername;
    this.isLoading.set(false);
  }

  loadOwnProfileDetails() {
    // Load detailed profile data (only for logged-in user viewing their own profile)
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

    // Carica i preferiti
    this.http.get<any[]>('/api/favorites').subscribe({
      next: (res) => {
        this.favourites = res;
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore nel caricamento dei preferiti');
      },
    });
  }

  enableEdit() {
    // Only allow editing own profile
    if (this.isOwnProfile) {
      this.editMode = true;
    }
  }

  updateProfile() {
    // Only allow updating own profile
    if (!this.isOwnProfile) return;
    
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
    // Only allow deleting own account
    if (!this.isOwnProfile) return;
    
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
    // We need to adapt this to get favorites for the profile we're viewing
    // For now, let's assume we can only see our own favorites
    if (this.isOwnProfile) {
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
    } else {
      // For other users' profiles, we could either show nothing or call a different endpoint
      // that returns public favorites
      this.loading = false;
    }
  }

  onToggleFavourite(cocktail: any) {
    // Only allow toggling favorites for own profile
    if (!this.isOwnProfile) return;
    
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
