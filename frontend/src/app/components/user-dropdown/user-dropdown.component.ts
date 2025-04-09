import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-dropdown',
  imports: [NgbDropdownModule, CommonModule],
  templateUrl: './user-dropdown.component.html',
  styleUrl: './user-dropdown.component.css'
})
export class UserDropdownComponent {
  showDropdown = false;

  username = ''; // ← aggiorna dinamicamente da API o localStorage
  userColor = '';
  userInitial = '';

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
}
