import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { NgIconsModule } from '@ng-icons/core';
import { heroUserCircle } from '@ng-icons/heroicons/outline';
import { heroXMark } from '@ng-icons/heroicons/outline';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      NgIconsModule.withIcons({ heroUserCircle, heroXMark }),
    ),
    provideHttpClient(),
    provideRouter(appRoutes),
  ]
}) .catch((err) => console.error(err));