import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { FavouritesService } from '../../services/favourites.service';
import { SearchService } from '../../services/search.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { UserCocktailsService } from '../../services/user-cocktails.service';

@Component({
  selector: 'app-cocktails-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, InfiniteScrollDirective],
  templateUrl: './cocktails-grid.component.html',
  styleUrls: ['./cocktails-grid.component.scss'],
})
export class CocktailsGridComponent implements OnInit, OnDestroy {
  @Input() sortType: string = 'name';
  @Input() cocktails: any[] = [];
  @Input() onlyFavorites: boolean = false;
  @Input() favoriteUsername: string = '';
  @Input() recommended: any[] = [];
  @Input() showRecommended: boolean = false;
  @Input() onlyCreatedBy: boolean = false;
  @Input() createdByUsername: string = '';


  filteredCocktails: any[] = [];
  displayedCocktails: any[] = [];
  loading = false;
  errorMessage = '';
  currentIndex = 0;
  pageSize = 30;
  scrollDistance = 3;  // Scrolla quando è alla fine
  scrollUpDistance = 2;  // Triggera lo scroll anche quando si ritorna verso l'alto

  private searchSub!: Subscription;
  private categorySub!: Subscription;
  private ingredientSub!: Subscription;
  private glassSub!: Subscription;

  constructor(
    private cocktailService: CocktailService,
    private favouritesService: FavouritesService,
    private searchService: SearchService,
    private userCocktailsService: UserCocktailsService
  ) {}

  ngOnInit() {
    this.subscribeToSearch();
    this.fetchAllCocktails();
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.categorySub?.unsubscribe();
    this.ingredientSub?.unsubscribe();
    this.glassSub?.unsubscribe();
  }

  ngOnChanges(): void {
    this.fetchAllCocktails();
  }

  loadMoreCocktails() {
    if (!this.loading) {
      this.loading = true;
      this.displayNextCocktails();
      this.loading = false;
    }
  }


  subscribeToSearch() {
    this.searchSub = this.searchService.searchQuery$.subscribe(() => this.applySearchFilter());
    this.categorySub = this.searchService.category$.subscribe(() => this.applySearchFilter());
    this.ingredientSub = this.searchService.ingredient$.subscribe(() => this.applySearchFilter());
    this.glassSub = this.searchService.glass$.subscribe(() => this.applySearchFilter());
  }


  fetchAllCocktails() {
    this.loading = true;

    const fetchFn = this.onlyCreatedBy
    ? this.userCocktailsService.getUserCocktails(this.createdByUsername || undefined)
    : this.cocktailService.getAllCocktails();
  
    fetchFn.subscribe(
      (data) => {
        // Mappa i cocktail e marca i recommended
        this.cocktails = data.map((cocktail) => ({
          ...cocktail,
          popularity: cocktail.popularity || 0,
          reviewsCount: cocktail.reviewsCount || 0,
          isFavorite: false,
          isRecommended: this.recommended?.some(r => r.idDrink === cocktail.idDrink) || false
        }));
  
        // Se non c'è una ricerca attiva e va data priorità ai recommended, ordina
        const query = this.searchService.searchQueryValue?.trim().toLowerCase();
        if (!query && this.showRecommended) {
          this.cocktails.sort((a, b) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            return 0;
          });
        }
  
        // Aggiungi info preferiti
        this.favouritesService.getFavourites(this.favoriteUsername || undefined).subscribe(
          (favourites) => {
            const favoriteIds = favourites.map((f: any) => f.idDrink);
            this.cocktails.forEach((cocktail) => {
              if (favoriteIds.includes(cocktail.idDrink)) {
                cocktail.isFavorite = true;
              }
            });
  
            this.applySearchFilter();
            this.loading = false;
          },
          (error) => {
            console.error('Error fetching favorites', error);
            this.applySearchFilter();
            this.loading = false;
          }
        );
      },
      (error) => {
        this.errorMessage = 'Error loading cocktails';
        this.loading = false;
      }
    );
  }
  
  
  applySearchFilter() {
    const query = this.searchService.searchQueryValue.trim().toLowerCase();
    const category = this.searchService.categoryValue.toLowerCase();
    const ingredient = this.searchService.ingredientValue.toLowerCase();
    const glass = this.searchService.glassValue.toLowerCase();
  
    // Filtraggio in base al valore di 'onlyFavorites'
    this.filteredCocktails = this.cocktails.filter((cocktail) => {
      const nameMatch = cocktail.strDrink.toLowerCase().includes(query);
      const categoryMatch = !category || cocktail.strCategory.toLowerCase().includes(category);
      const ingredientMatch =
        !ingredient ||
        Object.keys(cocktail)
          .filter((key) => key.startsWith('strIngredient') && cocktail[key])
          .some((key) => cocktail[key].toLowerCase().includes(ingredient));
      const glassMatch = !glass || cocktail.strGlass.toLowerCase().includes(glass);
  
      // Se 'onlyFavorites' è true, mostra solo i cocktail preferiti
      const favoritesMatch = !this.onlyFavorites || cocktail.isFavorite;
  
      return nameMatch && categoryMatch && ingredientMatch && glassMatch && favoritesMatch;
    });
  
    this.sortCocktails();
    this.resetPagination();
  }

  sortCocktails() {
    const query = this.searchService.searchQueryValue.trim().toLowerCase();
  
    // Ordina mettendo i recommended in alto solo se non c'è una ricerca attiva
    if (this.sortType === 'name' && this.showRecommended && !query) {
      this.filteredCocktails.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.strDrink.localeCompare(b.strDrink);
      });
      return;
    }
  
    // Altrimenti usa sort "normale"
    switch (this.sortType) {
      case 'name':
        this.filteredCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
        break;
      case 'popularity':
        this.filteredCocktails.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'reviews':
        this.filteredCocktails.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
    }
  }

  resetPagination() {
    this.currentIndex = 0;
    this.displayedCocktails = [];
    this.displayNextCocktails();
  }

  displayNextCocktails() {
    const nextCocktails = this.filteredCocktails.slice(this.currentIndex, this.currentIndex + this.pageSize);
    this.displayedCocktails.push(...nextCocktails);
    this.currentIndex += this.pageSize;
  }

  toggleFavorite(cocktail: any) {
    cocktail.isFavorite = !cocktail.isFavorite;
    if (cocktail.isFavorite) {
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
