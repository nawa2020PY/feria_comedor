import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { ConsumosComponent } from './consumos/consumos.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { ComedoresPermisosComponent } from './comedores-permisos/comedores-permisos.component';
import { ComedoresComponent } from './comedores/comedores.component';
import { EmpleadosComponent } from './empleados/empleados.component';
import { ConsumosEditComponent } from './consumos/consumos-edit/consumos-edit.component';
import { ComedoresEditComponent } from './comedores/comedores-edit/comedores-edit.component';
import { UsuariosEditComponent } from './usuarios/usuarios-edit/usuarios-edit.component';
import { FeriaHomeComponent } from './feria-home/feria-home.component';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    FolderPageRoutingModule,
    FormsModule
  ],
  declarations: [FolderPage,ConsumosComponent, EmpleadosComponent, ComedoresComponent, ComedoresPermisosComponent, UsuariosComponent, ConsumosEditComponent
    ,ComedoresEditComponent, UsuariosEditComponent,FeriaHomeComponent
  ]
})
export class FolderPageModule {}
