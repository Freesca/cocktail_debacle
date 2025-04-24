import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-image',
  imports: [CommonModule],
  templateUrl: './user-image.component.html',
  styleUrls: ['./user-image.component.scss']
})
export class UserImageComponent implements OnInit {
  @Input() imageUrl: string = ''; // Se vuoi usare un'immagine al posto dell'iniziale

  userName: string = '';
  userInitial: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.userInfo$.subscribe((res) => {
      if (res) {
        this.userName = res.username;
        this.userInitial = this.userName.charAt(0).toUpperCase(); // Prendi la prima lettera del nome utente
      }
    });
  }

  getColorForUser(): string {
    let hash = 0;
    for (let i = 0; i < this.userName.length; i++) {
      hash = this.userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 50%)`; // Colori vivaci e leggibili
  }
}
