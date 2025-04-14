// src/app/components/search-bar/search-bar.component.ts
import { Component, OnInit, NgModule } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { SearchService } from '../../services/search.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { appRoutes } from '../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  searchQuery = '';
  selectedCategory = '';  // Aggiungi questa proprietà
  selectedIngredient = '';  // Aggiungi questa proprietà
  selectedGlass = ''; 

  categories: string[] = [];
  ingredients: string[] = [];
  glasses: string[] = [];

  constructor(
    private cocktailService: CocktailService,
    private searchService: SearchService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Carica categorie, ingredienti e bicchieri da API
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
    // Aggiorna gli observable per i componenti in ascolto
    this.searchService.searchQuery.next(this.searchQuery.trim().toLowerCase());
    this.searchService.category.next(this.selectedCategory.toLowerCase());
    this.searchService.ingredient.next(this.selectedIngredient.toLowerCase());
    this.searchService.glass.next(this.selectedGlass.toLowerCase());

    // Reindirizza alla pagina dei risultati dei cocktail
    this.router.navigate(['/cocktails'], {
      queryParams: {
        q: this.searchQuery.trim().toLowerCase(),
        category: this.selectedCategory.toLowerCase(),
        ingredient: this.selectedIngredient.toLowerCase(),
        glass: this.selectedGlass.toLowerCase()
      }
    });
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
  
}
