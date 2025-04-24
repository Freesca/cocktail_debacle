import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { SearchService } from '../../services/search.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CocktailSorterComponent } from '../../components/cocktail-sorter/cocktail-sorter.component';
import { FavouritesService } from '../../services/favourites.service';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';

@Component({
  selector: 'app-cocktails',
  standalone: true,
  imports: [CommonModule, RouterModule, CocktailSorterComponent, CocktailsGridComponent],
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

  currentSort = 'name'; // default sorting by name

  constructor(
    @Inject(CocktailService) private cocktailService: CocktailService,
    private searchService: SearchService,
    private route: ActivatedRoute,
    @Inject(FavouritesService) private favouritesService: FavouritesService
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
  
    // Recupera tutti i cocktail
    this.cocktailService.getAllCocktails().subscribe(
      (data) => {
        // Aggiungi campi mancanti
        this.cocktails = data.map((cocktail) => ({
          ...cocktail,
          popularity: cocktail.popularity || 0,
          reviewsCount: cocktail.reviewsCount || 0,
          isFavorite: false, // inizialmente tutti non sono preferiti
        }));
  
        // Dopo aver caricato i cocktail, recupera i preferiti dell'utente
        this.favouritesService.getFavourites().subscribe(
          (favourites) => {
            const favouriteIds = favourites.map((f: any) => f.idDrink);
            this.cocktails.forEach((cocktail) => {
              if (favouriteIds.includes(cocktail.idDrink)) {
                cocktail.isFavourite = true;
              }
            });
  
            this.applySearchFilter(); // mostra i cocktail filtrati
            this.loading = false;
          },
          (error) => {
            console.error('Errore nel recuperare i preferiti', error);
            this.applySearchFilter();
            this.loading = false;
          }
        );
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

  onSortChange(sortType: string) {
    this.currentSort = sortType;
    this.sortCocktails();
    this.currentIndex = 0;
    this.displayedCocktails = [];
    this.displayNextCocktails();
  }

  sortCocktails() {
    switch (this.currentSort) {
      case 'name':
        this.filteredCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
        break;
      case 'popularity':
        this.filteredCocktails.sort((a, b) => {
          // Verifica che il campo popularity sia numerico, altrimenti metti un valore di default (0)
          const popA = typeof a.popularity === 'number' ? a.popularity : 0;
          const popB = typeof b.popularity === 'number' ? b.popularity : 0;
          return popB - popA;
        });
        break;
      case 'reviews':
        this.filteredCocktails.sort((a, b) => {
          // Verifica che il campo reviewsCount sia numerico, altrimenti metti un valore di default (0)
          const reviewsA = typeof a.reviewsCount === 'number' ? a.reviewsCount : 0;
          const reviewsB = typeof b.reviewsCount === 'number' ? b.reviewsCount : 0;
          return reviewsB - reviewsA;
        });
        break;
    }
  }


  toggleFavorite(cocktail: any) {
    cocktail.isFavourite = !cocktail.isFavorite;
    this.updateFavoriteStatus(cocktail);
  }
  
  updateFavoriteStatus(cocktail: any) {
    if (cocktail.isFavourite) {
      this.favouritesService.addFavourite(cocktail.idDrink).subscribe(
        () => console.log('Cocktail aggiunto ai preferiti'),
        (error) => console.error('Errore nell\'aggiungere ai preferiti', error)
      );
    } else {
      this.favouritesService.removeFavourite(cocktail.idDrink).subscribe(
        () => console.log('Cocktail rimosso dai preferiti'),
        (error) => console.error('Errore nel rimuovere dai preferiti', error)
      );
    }
  }
}