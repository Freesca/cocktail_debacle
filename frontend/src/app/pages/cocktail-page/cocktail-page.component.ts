import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CocktailService } from '../../services/cocktails.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cocktail-page',
  imports: [CommonModule],
  templateUrl: './cocktail-page.component.html',
  styleUrls: ['./cocktail-page.component.css'],
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
      this.cocktailService.getCocktailById(id).subscribe(
        (res) => {
          this.cocktail = res.drinks ? res.drinks[0] : null;
          this.loading = false;
        },
        (error) => {
          this.errorMessage = 'Errore nel caricare il cocktail.';
          this.loading = false;
        }
      );
    }
  }
}
