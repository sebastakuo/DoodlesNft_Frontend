import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './proyecto/header/header.component';
import { FooterComponent } from './proyecto/footer/footer.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, HttpClientModule],
})
export class AppComponent {
  footerLogoUrl = '/assets/logotipo.png';
}
