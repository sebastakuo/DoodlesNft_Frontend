import { Routes } from '@angular/router';
import { CreatorComponent } from './proyecto/creator/creator.component';
import { WalletComponent } from './proyecto/billetera/wallet.component';
import { InicioComponent } from './proyecto/inicio/inicio.component';
import { LibreriaComponent } from './proyecto/Libreria/libreria.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'creator', component: CreatorComponent },
  { path: 'nft-variation', component: CreatorComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'libreria', component: LibreriaComponent },
];