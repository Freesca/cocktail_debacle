import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CocktailService } from '../../services/cocktails.service';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';

@Component({
  selector: 'app-carousel',
  imports: [CommonModule, RouterModule, NgIconsModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent {
  sliderItems: { title: string, image: string, isDiscover: boolean }[] = [];
  slideDiscover = { title: 'Scopri', image: '/assets/images/discover.jpeg', isDiscover: true };
  currentIndex: number = 0;

  constructor(private cocktailService: CocktailService) {}

  ngOnInit() {
    this.cocktailService.getAllCocktails().subscribe({
      next: (cocktails) => {
        this.sliderItems = cocktails
          .filter(c => c.strDrinkThumb && c.strDrink)
          .slice(0, 9)
          .map(c => ({
            title: c.strDrink,
            image: c.strDrinkThumb,
            isDiscover: false
          }));
        this.sliderItems.push(this.slideDiscover);
      },
      error: () => {
        console.error('Errore nel caricamento dei cocktail per il carousel.');
      },
    });
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.sliderItems.length - 1;
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex < this.sliderItems.length - 1) ? this.currentIndex + 1 : 0;
  }
  

  // setHoveredIndex(index: number) {
  //   this.hoveredIndex = index;
  // }

  // getScale(index: number): string {
  //   if (this.hoveredIndex === null) return 'scale(0.8)';
  //   const distance = Math.abs(index - this.hoveredIndex);
  //   const scale = Math.max(1 - distance * 0.10, 0.6);
  //   return `scale(${scale})`;
  // }

  // getZIndex(index: number): number {
  //   if (this.hoveredIndex === null) return 1;
  //   return 100 - Math.abs(index - this.hoveredIndex);
  // }
}