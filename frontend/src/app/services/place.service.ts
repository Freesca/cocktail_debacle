import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlacePhoto {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
}

export interface PlaceResult {
  business_status?: string;
  formatted_address: string;
  geometry: PlaceGeometry;
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  name: string;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: PlacePhoto[];
  place_id: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  price_level?: number;
  rating?: number;
  reference?: string;
  types?: string[];
  user_ratings_total?: number;
}

export interface PlaceSearchResponse {
  html_attributions: string[];
  results: PlaceResult[];
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlaceService {
  private apiUrl = '/api/places/search';

  constructor(private http: HttpClient) { }

  searchPlaces(query: string): Observable<PlaceSearchResponse> {
    return this.http.get<PlaceSearchResponse>(`${this.apiUrl}?query=${encodeURIComponent(query)}`);
  }

  getPlacePhoto(photoReference: string, maxWidth: number = 400): Observable<Blob> {
    return this.http.get(`/api/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`, {
      responseType: 'blob'
    });
  }
}