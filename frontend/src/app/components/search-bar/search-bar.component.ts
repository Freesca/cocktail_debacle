// src/app/components/search-bar/search-bar.component.ts
import { Component, OnInit } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { SearchService } from '../../services/search.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbCollapse],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  isCollapsed = true;
  searchQuery = '';
  selectedCategory = '';
  selectedIngredient = '';
  selectedGlass = '';

  categories: string[] = [];
  ingredients: string[] = [];
  glasses: string[] = [];

  constructor(
    private cocktailService: CocktailService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadIngredients();
    this.loadGlasses();
  }

  loadCategories() {
    this.cocktailService.getCategories().subscribe(
      (data) => {
        this.categories = data.drinks.map((drink: any) => drink.strCategory);
      },
      (error) => {
        console.error('Errore nel caricare le categorie', error);
      }
    );
  }

  loadIngredients() {
    this.cocktailService.getIngredients().subscribe(
      (data) => {
        this.ingredients = data.drinks.map((drink: any) => drink.strIngredient1);
      },
      (error) => {
        console.error('Errore nel caricare gli ingredienti', error);
      }
    );
  }

  loadGlasses() {
    this.cocktailService.getGlasses().subscribe(
      (data) => {
        this.glasses = data.drinks.map((drink: any) => drink.strGlass);
      },
      (error) => {
        console.error('Errore nel caricare i bicchieri', error);
      }
    );
  }

  onSearch() {
    // Usa il SearchService per aggiornare lo stato di ricerca
    this.searchService.setSearchQuery(this.searchQuery.trim());
    this.searchService.setCategory(this.selectedCategory);
    this.searchService.setIngredient(this.selectedIngredient);
    this.searchService.setGlass(this.selectedGlass);

    // Naviga ai risultati con i query params
    this.router.navigate(['/cocktails'], {
      queryParams: {
        q: this.searchQuery.trim(),
        category: this.selectedCategory,
        ingredient: this.selectedIngredient,
        glass: this.selectedGlass,
      },
    });
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}

