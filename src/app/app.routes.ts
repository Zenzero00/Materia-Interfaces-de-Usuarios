import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
  // Ruta por defecto: carga el componente Auth
  { path: '', component: AuthComponent },
];