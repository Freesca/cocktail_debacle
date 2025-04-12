import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  sliderItems = [
    { title: 'Negroni', image: '/assets/images/Negroni.jpg' },
    { title: 'Hugo', image: '/assets/images/hugo.jpg' },
    { title: 'Vodka sour', image: '/assets/images/vodka-sour.jpg' },
    { title: 'Whiskey sour', image: '/assets/images/whiskeysour.jpg' },
  ];

  hoveredIndex: number | null = 1;

  setHoveredIndex(index: number) {
    this.hoveredIndex = index;
  }

  getScale(index: number): string {
    if (this.hoveredIndex === null) return 'scale(0.8)';

    const distance = Math.abs(index - this.hoveredIndex);
    const scale = Math.max(1 - distance * 0.10, 0.6);
    return `scale(${scale})`;
  }

  getZIndex(index: number): number {
    if (this.hoveredIndex === null) return 1;
    return 100 - Math.abs(index - this.hoveredIndex); // più vicini = zIndex più alto
  }
}
