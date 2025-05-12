import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of, switchMap, tap } from 'rxjs';
import { IndexedDBService } from './indexed-db.service';

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
  formatted_address?: string;
  vicinity?: string;
  geometry: PlaceGeometry;
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  name: string;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: PlacePhoto[];
  photoUrl?: string; // Added for displaying photos
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

export interface PlaceDetailsResponse {
  html_attributions: string[];
  result: PlaceResult;
  status: string;
}

interface CachedPlace {
  data: PlaceResult; // Data for the place
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlaceService {
  private apiUrl = '/api/places/search';
  private cacheDuration = 14 * 24 * 60 * 60 * 1000;  // 14 giorni
  private dbName = 'placesDB';
  private dbVersion = 1;

  constructor(private http: HttpClient, private indexedDBService: IndexedDBService) { }

  // Open IndexedDB
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject("Errore nell'aprire il database.");
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("places")) {
          db.createObjectStore("places", { keyPath: "place_id" });
        }
        if (!db.objectStoreNames.contains("photos")) {
          db.createObjectStore("photos", { keyPath: "photo_reference" });
        }
      };
    });
  }

  // Cache Place in IndexedDB
  private cachePlaceInDb(place: PlaceResult): void {
    this.openDb().then(db => {
      const transaction = db.transaction("places", "readwrite");
      const store = transaction.objectStore("places");
      const cacheKey = place.place_id;  // Usa il place_id come chiave
      store.put({ ...place, timestamp: Date.now() }, cacheKey);
    });
  }


  // Cache Photo in IndexedDB (Blob)
  private cachePhotoInDb(photoRef: string, photoBlob: Blob): void {
    this.openDb().then(db => {
      const transaction = db.transaction("photos", "readwrite");
      const store = transaction.objectStore("photos");
      const photoData = { 
        photo_reference: photoRef, 
        photo: photoBlob, 
        timestamp: Date.now() 
      };

      // Verifica se l'oggetto contiene una chiave primaria valida (photo_reference)
      if (photoData.photo_reference) {
        store.put(photoData);
      } else {
        console.error("Errore: la foto non ha un riferimento valido.");
      }
    }).catch(error => {
      console.error("Errore nell'aggiungere la foto:", error);
    });
  }


  // Get Cached Place from IndexedDB
  private getCachedPlaceFromDb(placeId: string): Promise<PlaceResult | null> {
    return new Promise((resolve, reject) => {
      this.openDb().then(db => {
        const transaction = db.transaction("places", "readonly");
        const store = transaction.objectStore("places");
        const request = store.get(placeId);  // Usa placeId come chiave

        request.onsuccess = () => {
          const place = request.result;
          if (place && Date.now() - place.timestamp < this.cacheDuration) {
            resolve(place);
          } else {
            resolve(null);  // Dati in cache scaduti
          }
        };
        request.onerror = () => reject("Errore nel recupero del luogo dalla cache.");
      });
    });
  }


  // Get Cached Photo from IndexedDB (Blob)
  private getCachedPhotoFromDb(photoRef: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      this.openDb().then(db => {
        const transaction = db.transaction("photos", "readonly");
        const store = transaction.objectStore("photos");
        const request = store.get(photoRef);

        request.onsuccess = () => {
          const photo = request.result;
          if (photo && Date.now() - photo.timestamp < this.cacheDuration) {
            resolve(photo.photo);
          } else {
            resolve(null);  // Foto in cache scaduta
          }
        };
        request.onerror = () => reject("Errore nel recupero della foto dalla cache.");
      });
    });
  }

  // Fetch and cache place details if not found in cache
  getPlaceDetails(placeId: string): Observable<PlaceDetailsResponse> {
    return new Observable(observer => {
      this.getCachedPlaceFromDb(placeId).then(cachedPlace => {
        if (cachedPlace) {
          observer.next({ html_attributions: [], result: cachedPlace, status: "OK" });
        } else {
          this.http.get<PlaceDetailsResponse>(`/api/places/details?placeid=${placeId}`).subscribe(response => {
            this.cachePlaceInDb(response.result);
            observer.next(response);
          });
        }
      }).catch(err => observer.error(err));
    });
  }

  getPlacePhoto(photoReference: string, maxWidth: number = 400): Observable<Blob> {
    return from(this.getCachedPhotoFromDb(photoReference)).pipe(
      switchMap((cachedPhoto) => {
        if (cachedPhoto) {
          return of(cachedPhoto); // restituisce il cachedPhoto se presente
        } else {
          return this.http.get(`/api/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`, { responseType: 'blob' }).pipe(
            tap((photoBlob: Blob) => {
              // Salviamo la foto scaricata in IndexedDB
              this.cachePhotoInDb(photoReference, photoBlob);  // Usa il metodo cachePhotoInDb del servizio
            })
          );
        }
      })
    );
  }



  searchPlaces(query: string): Observable<PlaceSearchResponse> {
    const cacheKey = `places_search_${query}`; // Usare una chiave unica per la ricerca
    return from(this.getCachedPlaceFromDb(cacheKey)).pipe(
      switchMap((cachedData) => {
        if (cachedData) {
          return of({ html_attributions: [], results: [cachedData], status: "OK" });
        } else {
          return this.http.get<PlaceSearchResponse>(`${this.apiUrl}?query=${encodeURIComponent(query)}`).pipe(
            tap(response => {
              // Cache la risposta di ricerca
              if (response.results && response.results.length > 0) {
                this.cachePlaceInDb(response.results[0]);  // Memorizza il primo risultato
              }
            })
          );
        }
      })
    );
  }



  searchNearbyPlaces(lat?: number, lng?: number): Observable<PlaceSearchResponse> {
    let url = '/api/places/nearby';

    if (lat !== undefined && lng !== undefined) {
      url += `?lat=${lat}&lng=${lng}`;
    }

    return new Observable(observer => {
      const cacheKey = `nearbyPlaces_${lat}_${lng}`;
      this.getCachedPlaceFromDb(cacheKey).then(cachedData => {
        if (cachedData) {
          observer.next({ html_attributions: [], results: [cachedData], status: "OK" });
        } else {
          this.http.get<PlaceSearchResponse>(url).subscribe(response => {
            if (response.results && response.results.length > 0) {
              this.cachePlaceInDb(response.results[0]);  // Cache the first result for now
            }
            observer.next(response);
          });
        }
      }).catch(err => observer.error(err));
    });
  }
}
