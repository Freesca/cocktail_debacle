import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CocktailReviewMetadata {
  cocktailId: number;
  externalId: string;
  name: string | null;
  averageScore: number;
  reviewCount: number;
}

export interface PlaceReviewMetadata {
  placeId: number;
  googlePlaceId: string;
  averageScore: number;
  reviewCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = '/api/reviews/metadata';

  constructor(private http: HttpClient) { }

  getPlaceReviewMetadata(placeId: string): Observable<CocktailReviewMetadata[]> {
    return this.http.get<CocktailReviewMetadata[]>(`${this.apiUrl}/place/${placeId}`,
      {
        withCredentials: true
      }
    );
  }

  getCocktailReviewMetadata(cocktailId: string, lat: number, lng: number): Observable<PlaceReviewMetadata[]> {
    return this.http.get<PlaceReviewMetadata[]>(
      `${this.apiUrl}/cocktail/${cocktailId}?lat=${lat}&lng=${lng}`,
      {
        withCredentials: true
      }
    );
  }
}
