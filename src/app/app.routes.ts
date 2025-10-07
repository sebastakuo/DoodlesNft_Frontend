import { Routes } from '@angular/router';
import { CreatorComponent } from './features/creator/creator.component';
import { WalletComponent } from './billetera/wallet.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { LibreriaComponent } from './features/galeria/libreria.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'creator', component: CreatorComponent },
  { path: 'nft-variation', component: CreatorComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'libreria', component: LibreriaComponent },
];