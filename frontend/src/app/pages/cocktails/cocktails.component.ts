import { Component } from '@angular/core';
import { CocktailSorterComponent } from '../../components/cocktail-sorter/cocktail-sorter.component';
import { CocktailsGridComponent } from '../../components/cocktails-grid/cocktails-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cocktails',
  standalone: true,
  imports: [CommonModule, CocktailSorterComponent, CocktailsGridComponent],
  templateUrl: 'cocktails.component.html',
  styleUrls: ['cocktails.component.scss'],
})
export class CocktailsComponent {
  currentSort = 'name';

  onSortChange(sortType: string) {
    this.currentSort = sortType;
  }
}
