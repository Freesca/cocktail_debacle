import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { SearchService } from '../../services/search.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cocktails',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cocktails.component.html',
  styleUrls: ['./cocktails.component.scss'],
})
export class CocktailsComponent implements OnInit, OnDestroy {
  cocktails: any[] = [];
  filteredCocktails: any[] = [];
  displayedCocktails: any[] = [];
  loading = false;
  errorMessage = '';
  currentIndex = 0;
  pageSize = 30;

  private searchSub!: Subscription;
  private categorySub!: Subscription;
  private ingredientSub!: Subscription;
  private glassSub!: Subscription;

  constructor(
    @Inject(CocktailService) private cocktailService: CocktailService,
    private searchService: SearchService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Leggi i parametri dalla URL
    this.route.queryParams.subscribe((params) => {
      const { q, category, ingredient, glass } = params;
      this.searchService.setSearchQuery(q || '');
      this.searchService.setCategory(category || '');
      this.searchService.setIngredient(ingredient || '');
      this.searchService.setGlass(glass || '');
    });

    // Ascolta i cambiamenti e applica i filtri
    this.searchSub = this.searchService.searchQuery$.subscribe(() => {
      this.applySearchFilter();
    });
    this.categorySub = this.searchService.category$.subscribe(() => {
      this.applySearchFilter();
    });
    this.ingredientSub = this.searchService.ingredient$.subscribe(() => {
      this.applySearchFilter();
    });
    this.glassSub = this.searchService.glass$.subscribe(() => {
      this.applySearchFilter();
    });

    this.fetchAllCocktails();
  }

  ngOnDestroy() {
    // Annulla l'abbonamento quando il componente viene distrutto
    this.searchSub?.unsubscribe();
    this.categorySub?.unsubscribe();
    this.ingredientSub?.unsubscribe();
    this.glassSub?.unsubscribe();
  }

  fetchAllCocktails() {
    this.loading = true;
    this.cocktailService.getAllCocktails().subscribe(
      (data) => {
        this.cocktails = data;
        this.applySearchFilter(); // iniziale
        this.loading = false;
      },
      (error) => {
        this.errorMessage = 'Errore nel caricare i cocktail!';
        this.loading = false;
      }
    );
  }

  applySearchFilter() {
    // Ottieni i valori attuali tramite i metodi get del service
    const query = this.searchService.searchQueryValue.trim().toLowerCase();
    const category = this.searchService.categoryValue.toLowerCase();
    const ingredient = this.searchService.ingredientValue.toLowerCase();
    const glass = this.searchService.glassValue.toLowerCase();

    this.filteredCocktails = this.cocktails.filter((cocktail) => {
      const nameMatch = cocktail.strDrink.toLowerCase().includes(query);
      const categoryMatch = !category || cocktail.strCategory.toLowerCase().includes(category);
      const ingredientMatch =
        !ingredient ||
        Object.keys(cocktail)
          .filter((key) => key.startsWith('strIngredient') && cocktail[key])
          .some((key) => cocktail[key].toLowerCase().includes(ingredient));
      const glassMatch = !glass || cocktail.strGlass.toLowerCase().includes(glass);

      return nameMatch && categoryMatch && ingredientMatch && glassMatch;
    });

    // Reset paginazione
    this.currentIndex = 0;
    this.displayedCocktails = [];
    this.displayNextCocktails();
  }

  displayNextCocktails() {
    const nextCocktails = this.filteredCocktails.slice(
      this.currentIndex,
      this.currentIndex + this.pageSize
    );
    this.displayedCocktails.push(...nextCocktails);
    this.currentIndex += this.pageSize;
  }
}
