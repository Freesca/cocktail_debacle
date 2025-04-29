import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaceService, PlaceResult, PlaceSearchResponse } from '../../services/place.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-places',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './places.component.html',
  styleUrl: './places.component.scss'
})
export class PlacesComponent implements OnInit {
  searchTerm = '';
  searchResults: PlaceResult[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Nearby places with pagination
  nearbyPlaces: PlaceResult[] = [];
  displayedNearbyPlaces: PlaceResult[] = [];
  nearbyPlacesCurrentIndex: number = 0;
  nearbyPlacesPageSize: number = 4;
  isLoadingNearby: boolean = false;
  nearbyError: boolean = false;
  
  private searchTerms = new Subject<string>();

  constructor(
    private placeService: PlaceService,
    private router: Router
  ) {
    this.searchTerms.pipe(
      // wait 300ms after each keystroke before considering the term
      debounceTime(300),
      
      // ignore new term if same as previous term
      distinctUntilChanged(),
      
      // switch to new search observable each time the term changes
      switchMap((term: string) => {
        if (!term.trim()) {
          // if search term is empty, return empty array
          return of({ results: [], status: 'EMPTY' });
        }
        
        this.isLoading = true;
        this.hasError = false;
        
        return this.placeService.searchPlaces(term).pipe(
          catchError(error => {
            this.hasError = true;
            this.errorMessage = 'Failed to fetch results. Please try again.';
            return of({ results: [], status: 'ERROR' });
          })
        );
      })
    ).subscribe(response => {
      this.isLoading = false;
      this.searchResults = response.results;
    });
  }

  ngOnInit(): void {
    // Load nearby places on component initialization
    this.searchNearbyPlaces();
  }

  // Format address for places that might not have formatted_address field
  getFormattedAddress(place: PlaceResult): string {
    // If formatted_address exists, return it
    if (place.formatted_address) {
      return place.formatted_address;
    }
    
    // Otherwise, try to construct an address from vicinity or other fields
    if (place.vicinity) {
      return place.vicinity;
    }
    
    // If no address info is available, return a generic message
    return 'Address not available';
  }

  // Search for nearby places using geolocation
  searchNearbyPlaces(): void {
    this.isLoadingNearby = true;
    this.nearbyError = false;
    this.nearbyPlaces = [];
    this.displayedNearbyPlaces = [];
    this.nearbyPlacesCurrentIndex = 0;

    // Use browser geolocation to get current coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Call the API with the current coordinates
          this.placeService.searchNearbyPlaces(lat, lng).subscribe({
            next: (response: PlaceSearchResponse) => {
              this.nearbyPlaces = response.results;
              this.displayNextNearbyPlaces();
              this.isLoadingNearby = false;
            },
            error: (error) => {
              console.error('Error searching nearby places:', error);
              this.nearbyError = true;
              this.isLoadingNearby = false;
            }
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.nearbyError = true;
          this.isLoadingNearby = false;
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.nearbyError = true;
      this.isLoadingNearby = false;
    }
  }

  displayNextNearbyPlaces(): void {
    const nextPlaces = this.nearbyPlaces.slice(
      this.nearbyPlacesCurrentIndex,
      this.nearbyPlacesCurrentIndex + this.nearbyPlacesPageSize
    );
    this.displayedNearbyPlaces = [...this.displayedNearbyPlaces, ...nextPlaces];
    this.nearbyPlacesCurrentIndex += this.nearbyPlacesPageSize;
  }

  // Push a search term into the observable stream
  search(term: string): void {
    this.searchTerm = term;
    this.searchTerms.next(term);
  }

  // Clear search results
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
  }

  // Navigate to place details page
  goToPlaceDetails(place: PlaceResult): void {
    this.router.navigate(['/place', place.place_id], { 
      state: { place: place }
    });
  }
}
