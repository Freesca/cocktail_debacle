import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CocktailReviewMetadata {
  cocktailId: string;
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

export interface CocktailReview {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface ReviewCreateDto {
  rating: number;
  comment: string;
  cocktailId: string;
  googlePlaceId: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = '/api/reviews/metadata';
  private reviewsUrl = '/api/reviews';

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

  getCocktailReviewsAtPlace(placeId: string, cocktailId: string): Observable<CocktailReview[]> {
    return this.http.get<CocktailReview[]>(
      `/api/reviews/place/${placeId}/cocktail/${cocktailId}`,
      {
        withCredentials: true
      }
    );
  }

  createReview(review: ReviewCreateDto): Observable<any> {
    return this.http.post(this.reviewsUrl, review, {
      withCredentials: true
    });
  }
}
