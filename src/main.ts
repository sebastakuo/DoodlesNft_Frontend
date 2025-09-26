import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
  ],
}).catch(err => console.error(err));
