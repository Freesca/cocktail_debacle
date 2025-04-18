import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService, CocktailReview, ReviewCreateDto } from '../../services/review.service';
import { PlaceService, PlaceResult } from '../../services/place.service';
import { CocktailService } from '../../services/cocktails.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  placeId: string = '';
  cocktailId: string = '';
  reviews: CocktailReview[] = [];
  
  loading: boolean = true;
  errorMessage: string = '';
  
  // Place details
  place: PlaceResult | null = null;
  placeLoading: boolean = false;
  placeError: boolean = false;
  placePhotoUrl: SafeUrl | null = null;
  
  // Cocktail details
  cocktail: any = null;
  cocktailLoading: boolean = false;
  cocktailError: boolean = false;
  
  // Review form
  showReviewForm: boolean = false;
  newReview: ReviewCreateDto = {
    rating: 5,
    comment: '',
    cocktailId: '',
    googlePlaceId: '',
    latitude: undefined,
    longitude: undefined
  };
  submittingReview: boolean = false;
  reviewSuccess: boolean = false;
  reviewError: string = '';

  // Rating options for the selector
  ratingOptions = [1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private placeService: PlaceService,
    private cocktailService: CocktailService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const placeId = params.get('placeId');
      const cocktailId = params.get('cocktailId');
      
      if (!placeId || !cocktailId) {
        this.errorMessage = 'Invalid parameters';
        this.loading = false;
        return;
      }
      
      this.placeId = placeId;
      this.cocktailId = cocktailId;
      
      // Initialize the new review with the IDs
      this.newReview.googlePlaceId = this.placeId;
      this.newReview.cocktailId = this.cocktailId;
      
      // Load the reviews and the details of the place and cocktail
      this.loadReviewsAndDetails();
    });
  }

  loadReviewsAndDetails(): void {
    this.loading = true;
    
    // Create an array of observables to load everything in parallel
    const reviewsRequest = this.reviewService.getCocktailReviewsAtPlace(this.placeId, this.cocktailId).pipe(
      catchError(error => {
        console.error('Error loading reviews:', error);
        this.errorMessage = 'Failed to load reviews.';
        return of([]);
      })
    );
    
    const placeRequest = this.placeService.getPlaceDetails(this.placeId).pipe(
      catchError(error => {
        this.placeError = true;
        console.error('Error loading place details:', error);
        return of(null);
      })
    );
    
    const cocktailRequest = this.cocktailService.getCocktailById(this.cocktailId).pipe(
      catchError(error => {
        this.cocktailError = true;
        console.error('Error loading cocktail details:', error);
        return of({});
      })
    );
    
    // Execute all requests in parallel
    forkJoin({
      reviews: reviewsRequest,
      place: placeRequest,
      cocktail: cocktailRequest
    }).subscribe(results => {
      this.loading = false;
      
      // Process reviews
      this.reviews = results.reviews;
      
      // Process place details
      if (results.place && results.place.result) {
        this.place = results.place.result;
        // Set latitude and longitude for the review
        if (this.place && this.place.geometry && this.place.geometry.location) {
          const location = this.place.geometry.location;
          this.newReview.latitude = location.lat;
          this.newReview.longitude = location.lng;
        }
        this.loadPlacePhoto();
      }
      
      // Process cocktail details
      if (results.cocktail) {
          // Direct cocktail object
          this.cocktail = results.cocktail;
      }
    });
  }
  
  loadPlacePhoto(): void {
    if (this.place?.photos && this.place.photos.length > 0) {
      const photoRef = this.place.photos[0].photo_reference;
      this.placeLoading = true;
      
      this.placeService.getPlacePhoto(photoRef, 400).subscribe({
        next: (blob) => {
          const objectURL = URL.createObjectURL(blob);
          this.placePhotoUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
          this.placeLoading = false;
        },
        error: () => {
          this.placeLoading = false;
          this.placeError = true;
        }
      });
    }
  }
  
  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
    // Reset form state when toggling
    if (this.showReviewForm) {
      this.reviewSuccess = false;
      this.reviewError = '';
    }
  }
  
  submitReview(): void {
    if (!this.newReview.comment.trim()) {
      this.reviewError = 'Please enter a comment';
      return;
    }
    
    this.submittingReview = true;
    this.reviewError = '';
    
    this.reviewService.createReview(this.newReview).subscribe({
      next: (response) => {
        this.submittingReview = false;
        this.reviewSuccess = true;
        // Reset form
        this.newReview.rating = 5;
        this.newReview.comment = '';
        // Reload reviews
        setTimeout(() => {
          this.loadReviewsAndDetails();
          this.showReviewForm = false;
          this.reviewSuccess = false;
        }, 2000);
      },
      error: (error) => {
        this.submittingReview = false;
        this.reviewError = error.error?.message || 'Failed to submit review. Please try again.';
        console.error('Error submitting review:', error);
      }
    });
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  getStarRating(score: number): string {
    return '★'.repeat(Math.round(score));
  }
  
  navigateToPlace(): void {
    this.router.navigate(['/place', this.placeId]);
  }
  
  navigateToCocktail(): void {
    this.router.navigate(['/cocktail', this.cocktailId]);
  }

  // Method to set rating in review form
  setRating(rating: number): void {
    this.newReview.rating = rating;
  }

  // Check if a rating is the currently selected one
  isSelectedRating(rating: number): boolean {
    return this.newReview.rating === rating;
  }

  // Get empty stars (for display)
  getEmptyStars(score: number): string {
    return '☆'.repeat(5 - Math.round(score));
  }
} 