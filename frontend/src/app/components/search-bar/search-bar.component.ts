// src/app/components/search-bar/search-bar.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service';
import { SearchService } from '../../services/search.service';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaceService } from '../../services/place.service';
import { NgIconsModule } from '@ng-icons/core';


@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule,  NgIconsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  isCollapsed: boolean = true;
  searchQuery = '';
  selectedCategory = '';
  selectedIngredient = '';
  selectedGlass = '';
  selectedMode: 'cocktails' | 'places' = 'cocktails'; // Modalità di ricerca
  isScrolled = false;
  isHome = false;

  categories: string[] = [];
  ingredients: string[] = [];
  glasses: string[] = [];

  constructor(
    private cocktailService: CocktailService,
    private searchService: SearchService,
    private router: Router,
    private placeService: PlaceService
  ) {}

  ngOnInit() {
    this.checkIfHome();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkIfHome();
      }
    })
    this.loadCategories();
    this.loadIngredients();
    this.loadGlasses();

  }

  

  private checkIfHome(): void {
    this.isHome = this.router.url === '/';
    this.isScrolled = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const offset = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled = offset > 10; 
  }

  loadCategories() {
    this.cocktailService.getCategories().subscribe(
      (data) => {
        this.categories = [...data]; // Aggiungiamo 'places' come categoria
      },
      (error) => {
        console.error('Errore nel caricare le categorie', error);
      }
    );
  }

  loadIngredients() {
    this.cocktailService.getIngredients().subscribe(
      (data) => {
        this.ingredients = data; // ✅ ora è un array di stringhe
      },
      (error) => {
        console.error('Errore nel caricare gli ingredienti', error);
      }
    );
  }

  loadGlasses() {
    this.cocktailService.getGlasses().subscribe(
      (data) => {
        this.glasses = data; // ✅ ora è un array di stringhe
      },
      (error) => {
        console.error('Errore nel caricare i bicchieri', error);
      }
    );
  }

  onSearch() {
    this.isScrolled = true;
  
    if (this.selectedMode === 'places') {
      // Aggiorniamo il servizio di ricerca con il nuovo valore
      this.searchService.setSearchQuery(this.searchQuery.trim());
  
      // Navigazione alla pagina dei luoghi senza duplicati
      if (this.router.url !== '/places') {
        this.router.navigate(['/places'], {
          queryParams: { q: this.searchQuery.trim() }
        });
      } else {
        // Emettiamo manualmente l'evento per aggiornare i risultati
        this.searchService.triggerUpdate();
      }
    } else {
      this.searchService.setSearchQuery(this.searchQuery.trim());
      this.searchService.setCategory(this.selectedCategory);
      this.searchService.setIngredient(this.selectedIngredient);
      this.searchService.setGlass(this.selectedGlass);
  
      this.router.navigate(['/cocktails'], {
        queryParams: {
          q: this.searchQuery.trim(),
          category: this.selectedCategory,
          ingredient: this.selectedIngredient,
          glass: this.selectedGlass,
        },
      });
    }
  }
  
  

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  toggleMode(): void {
    this.selectedMode = this.selectedMode === 'cocktails' ? 'places' : 'cocktails';
    this.onSearch();
  }
  
  toggleFilters() {
    this.isCollapsed = !this.isCollapsed;
  }

}
