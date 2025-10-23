import { Routes } from '@angular/router';
import { CreatorComponent } from './features/creator/creator.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { LibreriaComponent } from './features/galeria/libreria.component';
import { UserComponent } from './features/admin/users/user.component';
import { ProfileComponent } from './features/user/profile/profile.component';
import { RecordComponent } from './features/admin/record/record.component/record.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'creator', component: CreatorComponent },
  { path: 'nft-variation', component: CreatorComponent },
  { path: 'libreria', component: LibreriaComponent },
  { path: 'users', component: UserComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'record', component: RecordComponent },
  { path: '**', redirectTo: 'inicio', pathMatch: 'full' },
];