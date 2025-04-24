import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule } from '@ng-icons/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cocktails-grid',
  imports: [CommonModule, NgIconsModule, RouterModule],
  templateUrl: './cocktails-grid.component.html',
  styleUrls: ['./cocktails-grid.component.scss'],
})
export class CocktailsGridComponent {
  @Input() cocktails: any[] = [];
  @Input() loading = false;
  @Input() currentIndex = 0;
  @Input() pageSize = 30;
  @Input() total = 0;

  @Output() toggleFavorite = new EventEmitter<any>();
  @Output() loadMore = new EventEmitter<void>();

  onToggleFavorite(cocktail: any) {
    this.toggleFavorite.emit(cocktail);
  }

  onLoadMore() {
    this.loadMore.emit();
  }
}
