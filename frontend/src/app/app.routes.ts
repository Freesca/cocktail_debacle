import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CocktailsComponent } from './pages/cocktails/cocktails.component';
import { CocktailPageComponent } from './pages/cocktail-page/cocktail-page.component';
import { PlacesComponent } from './pages/places/places.component';
import { PlacePageComponent } from './pages/place-page/place-page.component';
// import { AboutComponent } from './about/about.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent, title: 'Home' },
  { path: 'cocktails', component: CocktailsComponent, title: 'Cocktails' },
  { path: 'cocktail/:id', component: CocktailPageComponent, title: 'Cocktail' },
  { path: 'places', component: PlacesComponent, title: 'Places' },
  { path: 'place/:id', component: PlacePageComponent, title: 'Place' },
//   { path: 'about', component: AboutComponent }
];