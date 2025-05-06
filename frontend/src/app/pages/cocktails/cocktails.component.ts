import { Component, OnInit } from '@angular/core';
import { CocktailSorterComponent } from '../../components/cocktail-sorter/cocktail-sorter.component';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from "../../components/search-bar/search-bar.component";
import { AuthService } from "../../services/auth.service";
import { CocktailService } from "../../services/cocktails.service";
import { UserService } from '../../services/user.service';



@Component({
  selector: 'app-cocktails',
  standalone: true,
  imports: [CommonModule, CocktailSorterComponent, CocktailsGridComponent, SearchBarComponent],
  templateUrl: 'cocktails.component.html',
  styleUrls: ['cocktails.component.scss'],
})
export class CocktailsComponent implements OnInit {
  currentSort = 'name';
  isLoggedIn = false;
  recommendedCocktails: any[] = [];
  recommendedReady: boolean = false;

  constructor(
    private cocktailService: CocktailService,
    private authService: AuthService,
    private userService: UserService
  ) {}
  

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn; 
      if (isLoggedIn) {
        this.userService.getProfile().subscribe((profile) => {
          if (profile.consentSuggestions) {
            this.cocktailService.getRecommendedCocktails().subscribe({
              next: (data) => {
                this.recommendedCocktails = data.map(c => ({ ...c, isRecommended: true }));
              },
              error: () => {
                this.recommendedCocktails = [];
              }
            });
          }
        });
      }
      this.recommendedReady = true;
    });
  }

  onSortChange(sortType: string) {
    this.currentSort = sortType;
  }
}
