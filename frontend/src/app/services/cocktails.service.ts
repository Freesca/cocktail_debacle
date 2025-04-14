import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CocktailService {
  private baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/';

  constructor(private http: HttpClient) {}

  getAllCocktails(): Observable<any[]> {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    const requests = chars.map((char) =>
      this.http.get<any>(`${this.baseUrl}search.php?f=${char}`)
    );

    return forkJoin(requests).pipe(
      map((responses) => {
        // Unisce tutti i risultati in un unico array
        return responses
          .map((res) => res.drinks || []) // esclude risultati null
          .flat(); // unisce tutti i sotto-array in uno solo
      })
    );
  }

  getCocktailById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}lookup.php?i=${id}`);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}list.php?c=list`);
  }

  // Metodo per ottenere ingredienti
  getIngredients(): Observable<any> {
    return this.http.get(`${this.baseUrl}list.php?i=list`);
  }

  // Metodo per ottenere bicchieri
  getGlasses(): Observable<any> {
    return this.http.get(`${this.baseUrl}list.php?g=list`);
  }
}
