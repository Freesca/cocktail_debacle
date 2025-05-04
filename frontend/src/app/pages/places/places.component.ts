import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaceService, PlaceResult, PlaceSearchResponse } from '../../services/place.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';


@Component({
  selector: 'app-places',
  standalone: true,
  imports: [CommonModule, FormsModule, InfiniteScrollDirective],
  templateUrl: './places.component.html',
  styleUrl: './places.component.scss'
})
export class PlacesComponent implements OnInit, OnDestroy {
  searchTerm = '';
  searchResults: PlaceResult[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  nearbyPlaces: PlaceResult[] = [];
  displayedNearbyPlaces: PlaceResult[] = [];
  nearbyPlacesCurrentIndex: number = 0;
  nearbyPlacesPageSize: number = 10;
  isLoadingNearby: boolean = false;
  nearbyError: boolean = false;
  scrollDistance = 1;  // Distanza in percentuale per attivare lo scroll
  scrollUpDistance = 2; // Distanza per triggerare lo scroll in alto

  
  private searchTerms = new Subject<string>();

  constructor(
    private placeService: PlaceService,
    private router: Router
  ) {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!term.trim()) {
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
    this.searchNearbyPlaces();
  }

  ngOnDestroy(): void {
    // Libera eventuali URL blob creati
    this.nearbyPlaces.forEach(place => {
      if (place['photoUrl']?.startsWith('blob:')) {
        URL.revokeObjectURL(place['photoUrl']);
      }
    });
  }

  getFormattedAddress(place: PlaceResult): string {
    if (place.formatted_address) return place.formatted_address;
    if (place.vicinity) return place.vicinity;
    return 'Address not available';
  }

  searchNearbyPlaces(): void {
    this.isLoadingNearby = true;
    this.nearbyError = false;
    this.nearbyPlaces = [];
    this.displayedNearbyPlaces = [];
    this.nearbyPlacesCurrentIndex = 0;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.placeService.searchNearbyPlaces(lat, lng).subscribe({
            next: (response: PlaceSearchResponse) => {
              this.nearbyPlaces = response.results;

              const blobRequests = this.nearbyPlaces.map(place => {
                const photoRef = place.photos?.[0]?.photo_reference;

                if (!photoRef) {
                  place['photoUrl'] = 'assets/default-place.jpg';
                  return of(null);
                }

                return this.placeService.getPlacePhoto(photoRef).pipe(
                  catchError(() => of(null)),
                  switchMap(blob => {
                    if (blob) {
                      const objectUrl = URL.createObjectURL(blob);
                      place['photoUrl'] = objectUrl;
                    } else {
                      place['photoUrl'] = 'assets/default-place.jpg';
                    }
                    return of(null);
                  })
                );
              });

              forkJoin(blobRequests).subscribe(() => {
                this.displayNextNearbyPlaces();
                this.isLoadingNearby = false;
              });
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
    console.log("Indice attuale:", this.nearbyPlacesCurrentIndex);
    console.log("Caricando i posti...");
    if (this.nearbyPlacesCurrentIndex >= this.nearbyPlaces.length) return;

    const nextPlaces = this.nearbyPlaces.slice(
      this.nearbyPlacesCurrentIndex,
      this.nearbyPlacesCurrentIndex + this.nearbyPlacesPageSize
    );

    this.displayedNearbyPlaces = [...this.displayedNearbyPlaces, ...nextPlaces];
    this.nearbyPlacesCurrentIndex += this.nearbyPlacesPageSize;
    console.log("Posti caricati:", this.displayedNearbyPlaces);
  }
  

  search(term: string): void {
    this.searchTerm = term;
    this.searchTerms.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
  }

  goToPlaceDetails(place: PlaceResult): void {
    this.router.navigate(['/place', place.place_id], { 
      state: { place: place }
    });
  }
}
