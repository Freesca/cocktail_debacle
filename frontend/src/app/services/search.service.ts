// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  searchQuery = new BehaviorSubject<string>('');
  category = new BehaviorSubject<string>('');
  ingredient = new BehaviorSubject<string>('');
  glass = new BehaviorSubject<string>('');

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }
}
