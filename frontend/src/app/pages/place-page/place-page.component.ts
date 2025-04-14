import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaceService, PlaceResult } from '../../services/place.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReviewService, CocktailReviewMetadata } from '../../services/review.service';
import { CocktailService } from '../../services/cocktails.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface CocktailReviewWithDetails extends CocktailReviewMetadata {
  strDrink?: string;
  strDrinkThumb?: string;
  loading?: boolean;
  error?: boolean;
}

@Component({
  selector: 'app-place-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './place-page.component.html',
  styleUrl: './place-page.component.css'
})
export class PlacePageComponent implements OnInit {
  place: PlaceResult | null = null;
  placeId: string = '';
  loading: boolean = true;
  error: boolean = false;
  photoUrl: SafeUrl | null = null;
  photoLoading: boolean = false;
  cocktailReviews: CocktailReviewWithDetails[] = [];
  reviewsLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private placeService: PlaceService,
    private reviewService: ReviewService,
    private cocktailService: CocktailService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Get the place ID from the route parameters
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.navigateToPlaces();
        return;
      }
      
      this.placeId = id;
      
      // Get the place information from history state
      const navigationState = window.history.state;
      if (navigationState && navigationState.place) {
        this.place = navigationState.place;
        this.loading = false;
        
        // Load the photo if available
        this.loadPlacePhoto();
        
        // Load cocktail reviews for this place
        this.loadCocktailReviews();
      } else {
        // If no state data, go back to places search
        this.navigateToPlaces();
      }
    });
  }

  loadPlacePhoto(): void {
    if (this.place?.photos && this.place.photos.length > 0) {
      const photoRef = this.place.photos[0].photo_reference;
      this.photoLoading = true;
      
      this.placeService.getPlacePhoto(photoRef, 800).subscribe({
        next: (blob) => {
          const objectURL = URL.createObjectURL(blob);
          this.photoUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
          this.photoLoading = false;
        },
        error: () => {
          this.photoLoading = false;
        }
      });
    }
  }

  loadCocktailReviews(): void {
    this.reviewsLoading = true;
    
    this.reviewService.getPlaceReviewMetadata(this.placeId).subscribe({
      next: (metadata) => {
        // Initialize cocktail reviews array
        this.cocktailReviews = metadata.map(item => ({
          ...item,
          loading: true,
          error: false
        }));
        
        // For each cocktail in the metadata, fetch its details
        if (this.cocktailReviews.length > 0) {
          this.loadCocktailDetails();
        } else {
          this.reviewsLoading = false;
        }
      },
      error: () => {
        this.reviewsLoading = false;
      }
    });
  }

  loadCocktailDetails(): void {
    // Create observables for each cocktail
    const cocktailRequests = this.cocktailReviews.map(review => {
      return this.cocktailService.getCocktailById(review.externalId).pipe(
        map(response => {
          const drink = response.drinks && response.drinks.length > 0 ? response.drinks[0] : null;
          return {
            review,
            drink
          };
        }),
        catchError(() => {
          // Handle error for this specific cocktail
          return of({ review, drink: null });
        })
      );
    });
    
    // Execute all requests in parallel
    forkJoin(cocktailRequests).subscribe(results => {
      // Update each cocktail review with details
      results.forEach(result => {
        const index = this.cocktailReviews.findIndex(r => r.externalId === result.review.externalId);
        if (index !== -1) {
          if (result.drink) {
            this.cocktailReviews[index] = {
              ...this.cocktailReviews[index],
              strDrink: result.drink.strDrink,
              strDrinkThumb: result.drink.strDrinkThumb,
              loading: false
            };
          } else {
            this.cocktailReviews[index] = {
              ...this.cocktailReviews[index],
              loading: false,
              error: true
            };
          }
        }
      });
      
      this.reviewsLoading = false;
    });
  }

  navigateToPlaces(): void {
    this.router.navigate(['/places']);
  }

  navigateToCocktail(externalId: string): void {
    this.router.navigate(['/cocktail', externalId]);
  }

  getStarRating(score: number): string {
    return '★'.repeat(Math.round(score));
  }
} 