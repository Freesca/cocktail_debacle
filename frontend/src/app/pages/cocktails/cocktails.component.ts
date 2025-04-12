import { Component, Inject, OnInit } from '@angular/core';
import { CocktailService } from '../../services/cocktails.service'; // Assicurati che il percorso sia corretto
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importa Router se necessario

@Component({
  selector: 'app-cocktails',
  imports: [ CommonModule, RouterModule ],
  templateUrl: './cocktails.component.html',
  styleUrl: './cocktails.component.css',
  providers: [CocktailService]
})
export class CocktailsComponent  implements OnInit {
  cocktails: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(@Inject(CocktailService) private cocktailService: CocktailService) {}

  ngOnInit() {
    this.fetchAllCocktails(); // Carica tutti i drink
  }

  // Metodo per ottenere tutti i drink
  fetchAllCocktails() {
    this.loading = true;
    this.cocktailService.getAllCocktails().subscribe(
      (cocktails) => {
        this.cocktails = cocktails;
        this.loading = false;
      },
      (error) => {
        this.errorMessage = 'Errore nel caricare i cocktail!';
        this.loading = false;
      }
    );
  }  
}