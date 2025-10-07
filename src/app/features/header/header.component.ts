import { Component } from '@angular/core';
import { WalletComponent } from '../../billetera/wallet.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [WalletComponent, RouterLink],
})
export class HeaderComponent {}
