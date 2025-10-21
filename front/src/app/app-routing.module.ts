import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { jwtCheckGuard } from './guards/jwt-check.guard';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'comedor',
    canActivate: [jwtCheckGuard],
    component: LayoutComponent,
    children:[
      {
        path: 'abm',
        canActivate: [jwtCheckGuard],
        loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
      },
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login' // Redirect to login for any unmatched routes
  }
  // Redirect to login if no other route matches
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
