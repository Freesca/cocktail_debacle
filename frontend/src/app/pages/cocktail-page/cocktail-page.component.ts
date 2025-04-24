import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CocktailService } from '../../services/cocktails.service';
import { CommonModule } from '@angular/common';
import { ReviewsCocktailComponent } from '../../components/reviews-cocktail/reviews-cocktail.component';

@Component({
  selector: 'app-cocktail-page',
  standalone: true,
  imports: [CommonModule, ReviewsCocktailComponent],
  templateUrl: './cocktail-page.component.html',
  styleUrls: ['./cocktail-page.component.scss'],
})
export class CocktailPageComponent implements OnInit {
  cocktail: any;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private cocktailService: CocktailService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cocktailService.getCocktailById(id).subscribe({
        next: (res) => {
          this.cocktail = res;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Errore nel caricare il cocktail.';
          this.loading = false;
        },
      });
    }
  }

  getIngredientDots(): number[] {
    const ingredientCount = 15;
    const availableIngredients = [];

    for (let i = 1; i <= ingredientCount; i++) {
      if (this.cocktail?.[`strIngredient${i}`]) {
        availableIngredients.push(i);
      }
    }

    return availableIngredients;
  }
}
