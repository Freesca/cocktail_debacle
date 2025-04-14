import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaceService, PlaceResult } from '../../services/place.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-places',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './places.component.html',
  styleUrl: './places.component.css'
})
export class PlacesComponent {
  searchTerm = '';
  searchResults: PlaceResult[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
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
