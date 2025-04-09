import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
// import { AboutComponent } from './about/about.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent, title: 'Home' },
//   { path: 'about', component: AboutComponent }
];