import { Component, NgModule, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserImageComponent } from '../../components/user-image/user-image.component';
import { AuthService } from '../../services/auth.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';
import { FavouritesService } from '../../services/favourites.service';
import { ReviewService } from '../../services/review.service';
import { Review } from '../../services/review.service';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import { SearchService } from '../../services/search.service';
import { UserService } from '../../services/user.service';
import { UpdateProfileDto, DeleteProfileDto } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    UserImageComponent,
    ReviewCardComponent,
    NgbNavModule,
    CocktailsGridComponent,
  ],
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
  profileForm!: FormGroup;
  deletePassword: string = '';

  
  // Profile visibility controls
  isOwnProfile = false;
  profileUsername = '';
  loggedInUsername = '';

  // Reviews
  reviews: Review[] = [];
  reviewsLoading: boolean = false;
  reviewsError: string = '';
  ratingOptions = [1, 2, 3, 4, 5];

  savedScrollY: number = 0;



  constructor(
    private router: Router,
    private http: HttpClient, 
    private authService: AuthService, 
    private favouritesService: FavouritesService,
    private route: ActivatedRoute,
    private reviewService: ReviewService,
    private searchService: SearchService,
    private userService: UserService,
    private fb: FormBuilder
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

    this.loadUserReviews();
    this.searchService.resetFilters();
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

        this.profileForm = this.fb.group({
          username: [this.username, [Validators.required]],
          email: [this.email, [Validators.required, Validators.email]],
          oldPassword: [''],
          newPassword: [''],
          confirmPassword: [''],
          consentData: this.consentData,
          consentSuggestions: this.consentSuggestions,
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore di caricamento profilo');
        this.isLoading.set(false);
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
    if (!this.isOwnProfile) return;
    if (this.profileForm.invalid) return;
  
    const oldUsername = this.username;  // Salva il vecchio username
    const data: UpdateProfileDto = this.profileForm.value;
  
    this.userService.updateProfile(data).subscribe({
      next: () => {
        const newUsername = this.profileForm.get('username')?.value;
        this.successMessage.set('Profilo aggiornato con successo!');
        this.error.set('');
        this.editMode = false;
  
        this.profileForm.patchValue({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
  
        // Redirect e reload
        if (newUsername !== oldUsername) {
          this.router.navigate(['/user', newUsername]).then(() => location.reload());
        } else {
          location.reload();
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
        this.successMessage.set('');
      }
    });
  }
  

  deleteAccount() {
    if (!this.isOwnProfile) return;
  
    const dto: DeleteProfileDto = { password: this.deletePassword };
  
    this.userService.deleteAccount(dto).subscribe({
      next: () => {
        this.successMessage.set('Account eliminato con successo!');
  
        // Esegui logout dell'utente
        this.authService.logout();
  
        // Reindirizza alla home e ricarica completamente la pagina
        this.router.navigate(['/']).then(() => location.reload());
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Errore durante la cancellazione');
      },
    });
  }
  

  loadUserReviews() {
    this.savedScrollY = window.scrollY;
    this.reviewsLoading = true;
    this.reviewsError = '';
  
    this.reviewService.getUserReviews(this.profileUsername).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.reviewsLoading = false;
        setTimeout(() => window.scrollTo(0, this.savedScrollY), 0); // ripristina la posizione
      },
      error: (error) => {
        this.reviewsError = 'Failed to load reviews.';
        console.error(error);
        this.reviewsLoading = false;
      }
    });
  }  
}
