import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConsumosComponent } from './consumos/consumos.component';
import { jwtCheckGuard } from '../guards/jwt-check.guard';
import { ComedoresComponent } from './comedores/comedores.component';
import { ComedoresPermisosComponent } from './comedores-permisos/comedores-permisos.component';
import { EmpleadosComponent } from './empleados/empleados.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { ConsumosEditComponent } from './consumos/consumos-edit/consumos-edit.component';
import { ComedoresEditComponent } from './comedores/comedores-edit/comedores-edit.component';
import { UsuariosEditComponent } from './usuarios/usuarios-edit/usuarios-edit.component';
import { FeriaHomeComponent } from './feria-home/feria-home.component';

const routes: Routes = [
  {
    path: 'home',
    pathMatch: 'full',
    component: FeriaHomeComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'consumos',
    pathMatch: 'full',
    component: ConsumosComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'consumo/edit/:id',
    component: ConsumosEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'consumo/create',
    component: ConsumosEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'comedores',
    component: ComedoresComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path:'comedores/edit/:id',
    component: ComedoresEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'comedores/create',
    component: ComedoresEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'usuarios/edit/:id',
    component: UsuariosEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'usuarios/create',
    component: UsuariosEditComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'comedoresPermisos',
    component: ComedoresPermisosComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'empleados',//TODO: Guard de userType
    component: EmpleadosComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [jwtCheckGuard],
  },
  {
    path: "**",
    redirectTo: 'home', // Redirect to home for any unmatched routes
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FolderPageRoutingModule {}
