import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CocktailService {
  private baseUrl = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?f=';

  constructor(private http: HttpClient) {}

  getAllCocktails(): Observable<any[]> {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    const requests = chars.map((char) =>
      this.http.get<any>(`${this.baseUrl}${char}`)
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
    return this.http.get<any>(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
  }
  
}
